import { IState } from '../models/index.models';

export const MAX_BUFFER_UNDO_MEMORY = 25;
let rotate = 1;

export const convertImageUsingCanvas = (
  dataSrc: string,
  changeHeight = false,
  state: IState,
  options?: { getDimFromImage?: boolean; rotate?: number },
): Promise<{ imageUri: string; state: any }> => {
  return new Promise(async (resolve, _) => {
    let img = document.createElement('img');
    img.src = dataSrc + '';
    img.crossOrigin = 'Anonymous';
    let quality = state.quality / 100;
    let maintainRatio = state.maintainAspectRatio;

    img.onload = () => {
      var canvas = document.createElement('canvas');
      let ctx: CanvasRenderingContext2D | null | any = canvas.getContext('2d');
      let ratio = img.width / img.height;
      let width = state.maxWidth;
      let height = state.maxHeight;

      if (options?.getDimFromImage) {
        width = img.width;
        height = img.height;
      }

      if (maintainRatio) {
        canvas.width = width;
        canvas.height = width / ratio;
        if (changeHeight) {
          canvas.width = height * ratio;
          canvas.height = height;
        }
      } else {
        canvas.width = width;
        canvas.height = height;
      }
      if (state.basicFilters) {
        ctx.filter = processFilter(state.basicFilters);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let type = state.format;
      var dataURI = canvas.toDataURL(`image/${type}`, quality);
      // console.log("🚀 ~ file: image-processing.ts ~ line 48 ~ returnnewPromise ~ quality", quality)
      resolve({
        dataUri: dataURI,
        width: canvas.width,
        height: canvas.height,
      });
    };
  }).then((data: any) => {
    state.maxHeight = data.height;
    state.maxWidth = data.width;
    return { imageUri: data.dataUri, state: saveState(state, data.dataUri) };
  });

  function processFilter(data: any) {
    return Object.keys(data)
      .map((key) => {
        if (['blur'].includes(key)) {
          return `${key}(${data[key]}px)`;
        } else {
          return `${key}(${data[key]})`;
        }
      })
      .join('');
  }
};

export const saveState = (state: IState, lastImage?: string): IState => {
  if (state.arrayCopiedImages.length <= MAX_BUFFER_UNDO_MEMORY) {
    state.arrayCopiedImages.push({
      lastImage: lastImage as any,
      width: state.maxWidth,
      height: state.maxHeight,
      quality: state.quality,
      format: state.format,
      originImageSrc: state.originImageSrc as any,
      basicFilters: state.basicFilters,
    });
  } else {
    state.arrayCopiedImages[state.arrayCopiedImages.length - 1] = {
      lastImage: lastImage as any,
      width: state.maxWidth,
      height: state.maxHeight,
      quality: state.quality,
      format: state.format,
      originImageSrc: state.originImageSrc as any,
      basicFilters: state.basicFilters,
    };
  }
  return JSON.parse(JSON.stringify(state));
};
