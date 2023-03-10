/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { canvasGetImageDataAvgColor, distanceWeightConst, distanceWeightEuclidean, distanceWeightEuclidean2, type DistanceWeightFn, distanceWeightManhattan, distanceWeightManhattan2, CanvasUndoableRect } from './util/canvas';
import { RGBColorToHex, type RGBColor } from './util/color';
import { colorClosest } from './util/colorClosest';
import { type ColorDistanceFn, colorDistanceParamspaceSquare, colorDistanceRedmeanSquare, colorDistanceWeightedSquare } from './util/colorDistance';
import { colorNames } from './util/colorNames';
import { colorNamesSimple } from './util/colorNamesSimple';
import { addEventListenerMouseDownMove } from './util/EventListener';
import { forceGetElementById } from './util/forceQuerySelector';
import { roundFixed } from './util/math';

const sliderPointRadiusElement = forceGetElementById<HTMLInputElement>('input-point-radius');
const selectPointDistFnElement = forceGetElementById<HTMLOptionElement>('select-point-dist-fn');
const checkboxPointDraw = forceGetElementById<HTMLInputElement>('input-point-draw');
const selectColorDistFnElement = forceGetElementById<HTMLOptionElement>('select-color-dist-fn');
const fileInputElement = forceGetElementById<HTMLInputElement>('file-input');
const canvas = forceGetElementById<HTMLCanvasElement>('canvas');
const canvas2d: CanvasRenderingContext2D = canvas.getContext('2d', { willReadFrequently: true })!;

Object.assign(window, { canvas, canvas2d });

const distFns = {
  euclidean: distanceWeightEuclidean,
  euclidean2: distanceWeightEuclidean2,
  manhattan: distanceWeightManhattan,
  manhattan2: distanceWeightManhattan2,
  const: distanceWeightConst,
} as const;

const colorDistFns = {
  redmean: colorDistanceRedmeanSquare,
  weighted: colorDistanceWeightedSquare,
  paramspace: colorDistanceParamspaceSquare,
} as const;

function onFileInput (evt: Event): void {
  const files = (evt.target as HTMLInputElement).files;
  if (files == null) return;
  const file = files[0];

  if (!file.type.match('image.*')) return;

  const reader = new FileReader();

  reader.addEventListener('load', (e) => {
    console.log('file', file, e, reader.result);
    if (reader.result == null) return;
    const img = document.createElement('img');
    // Render thumbnail.
    img.src = String(reader.result);
    // img.title = theFile.name;

    img.addEventListener('load', function onImageLoad () {
      console.log(`img width:${img.width} height:${img.height}`);

      const canvasRect = canvas.getBoundingClientRect();

      // canvas.width = Math.max(img.width, 200);
      // canvas.height = Math.max(img.height, 200);
      canvas2d.drawImage(img, 0, 0, canvasRect.width, canvasRect.height);
    });
  });

  // Read in the image file as a data URL.
  reader.readAsDataURL(file);
}

fileInputElement.addEventListener('change', onFileInput);

let canvasRect: CanvasUndoableRect | null = null;

const textColorRGB = forceGetElementById<HTMLSpanElement>('text-color-rgb');
const textColorHex = forceGetElementById<HTMLSpanElement>('text-color-hex');
const textColorColor = forceGetElementById<HTMLSpanElement>('text-color-color');

const textColorName = forceGetElementById<HTMLSpanElement>('text-color-name');
const textColorNameDistance = forceGetElementById<HTMLSpanElement>('text-color-name-distance');
const textColorNameRGB = forceGetElementById<HTMLSpanElement>('text-color-name-rgb');
const textColorNameHex = forceGetElementById<HTMLSpanElement>('text-color-name-hex');
const textColorNameColor = forceGetElementById<HTMLSpanElement>('text-color-name-color');

const textColorNameSimple = forceGetElementById<HTMLSpanElement>('text-color-name-simple');
const textColorNameSimpleDistance = forceGetElementById<HTMLSpanElement>('text-color-name-simple-distance');
const textColorNameSimpleRGB = forceGetElementById<HTMLSpanElement>('text-color-name-simple-rgb');
const textColorNameSimpleHex = forceGetElementById<HTMLSpanElement>('text-color-name-simple-hex');
const textColorNameSimpleColor = forceGetElementById<HTMLSpanElement>('text-color-name-simple-color');

function onMouseMove (e: MouseEvent): void {
  canvasRect?.undo();
  canvasRect = null;

  const x = Math.min(e.offsetX, canvas.width - 1);
  const y = Math.min(e.offsetY, canvas.height - 1);
  const rectSize = Math.floor(Number(sliderPointRadiusElement.value));
  const pointDistFn: DistanceWeightFn = Reflect.get(distFns, selectPointDistFnElement.value);
  const colorDistFn: ColorDistanceFn = Reflect.get(colorDistFns, selectColorDistFnElement.value);
  const color = canvasGetImageDataAvgColor(canvas, x, y, { rectSize, distFn: pointDistFn });

  const roundColors: RGBColor = color.map(Math.round) as RGBColor;
  textColorRGB.innerText = roundColors.join(', ');
  textColorHex.innerText = RGBColorToHex(roundColors);
  textColorColor.style.backgroundColor = `rgb(${roundColors.join(', ')})`;

  const closestColorName = colorClosest(color, colorNames, colorDistFn);
  textColorName.innerText = closestColorName.name;
  textColorNameDistance.innerText = String(roundFixed(Math.sqrt(closestColorName.distance), 2));
  textColorNameRGB.innerText = closestColorName.color.join(', ');
  textColorNameHex.innerText = RGBColorToHex(closestColorName.color);
  textColorNameColor.style.backgroundColor = `rgb(${closestColorName.color.join(', ')})`;

  const closestColorNameSimple = colorClosest(color, colorNamesSimple, colorDistFn);
  textColorNameSimple.innerText = closestColorNameSimple.name;
  textColorNameSimpleDistance.innerText = String(roundFixed(Math.sqrt(closestColorNameSimple.distance), 2));
  textColorNameSimpleRGB.innerText = closestColorNameSimple.color.join(', ');
  textColorNameSimpleHex.innerText = RGBColorToHex(closestColorNameSimple.color);
  textColorNameSimpleColor.style.backgroundColor = `rgb(${closestColorNameSimple.color.join(', ')})`;

  if (checkboxPointDraw.checked) {
    canvas2d.beginPath();
    canvas2d.lineWidth = 1;
    canvas2d.strokeStyle = 'red';
    canvasRect = CanvasUndoableRect.rect(canvas2d, color.rectX, color.rectY, color.rectW, color.rectH);
    canvas2d.stroke();
  }
}

addEventListenerMouseDownMove(canvas, onMouseMove);
