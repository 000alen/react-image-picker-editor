/* eslint-disable react-hooks/exhaustive-deps */
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { ImagePickerConf, IState } from "./index.models";
import labelEs from "./i18n/es.json";
import labelPT from "./i18n/pt.json";
import labelEn from "./i18n/en.json";
import labelFr from "./i18n/fr.json";
import labelDe from "./i18n/de.json";
import { convertImageUsingCanvas } from "./image-processing";
import { Button, Image as ImageComponent, Skeleton, Space } from "antd";
import ParentSize from "./ParentSize";
import {
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";

export * from "./index.models";

const initialConfig: ImagePickerConf = {
  language: "en",
  objectFit: "cover",
  hideDeleteBtn: false,
  hideDownloadBtn: false,
  hideAddBtn: false,
  compressInitial: null,
};

const initialState: IState = {
  maxHeight: 3000,
  maxWidth: 3000,
  maintainAspectRatio: true,
  format: "jpeg",
  arrayCopiedImages: [],
  originImageSrc: "",
  quality: 100,
};

const ImagePicker = memo(
  ({
    config = {},
    imageSrcProp = "",
    imageChanged = () => {},
  }: {
    config: ImagePickerConf;
    imageSrcProp?: string;
    imageChanged?: (uri: string | null) => void;
  }) => {
    const [state, setState] = useState<IState>({
      ...initialState,
    });
    const [imageSrc, setImageSrc] = useState<string | null>("");
    const [loadImage, setLoadImage] = useState<boolean>(false);
    const [labels, setLabels] = useState<any>(labelEn);
    const [configuration, setConfiguration] =
      useState<ImagePickerConf>(initialConfig);
    const imagePicker = useRef<any>(null);
    const fileType = useRef("");
    const urlImage = useRef("");
    const uuidFilePicker = Date.now().toString(20);
    const imageName = useRef("download");

    async function loadImageFromProps() {
      if (imageSrcProp) {
        let result = await parseToBase64(imageSrcProp);
        let newState: IState = result.state;
        newState.originImageSrc = imageSrcProp;
        newState.arrayCopiedImages = [
          {
            lastImage: result.imageUri,
            width: newState.maxWidth,
            height: newState.maxHeight,
            quality: newState.quality,
            format: newState.format,
            originImageSrc: imageSrcProp,
          },
        ];
        // console.log("NEW STATE", newState)
        setImageSrc(result.imageUri);
        setState(newState);
        setLoadImage(true);
      } else {
        let newState = { ...state };
        newState.originImageSrc = null;
        newState.arrayCopiedImages = [];
        setLoadImage(false);
        setImageSrc(null);
        setState(newState);
      }
    }

    function processConfig() {
      let dataConf = { ...configuration, ...config };
      setConfiguration(dataConf);

      if (config.language != undefined) {
        if (config.language == "en") {
          setLabels({ ...labelEn });
        }
        if (config.language == "pt") {
          setLabels({ ...labelPT });
        }
        if (config.language == "es") {
          setLabels({ ...labelEs });
        }
        if (config.language == "fr") {
          setLabels({ ...labelFr });
        }
        if (config.language == "de") {
          setLabels({ ...labelDe });
        }
      }
    }

    function onUpload(event: any) {
      event.preventDefault();
      imagePicker?.current?.click();
    }

    function handleFileSelect(this: typeof handleFileSelect, event: any) {
      const files = event.target?.files;
      if (files) {
        const file = files[0];
        imageName.current = file.name.split(".")[0];
        fileType.current = file.type;
        if (!fileType.current.includes("image")) return;
        urlImage.current = `data:${file.type};base64,`;
        if (file) {
          setState({ ...state, format: fileType.current.split("image/")[1] });
          const reader = new FileReader();
          reader.onload = handleReaderLoaded.bind(this);
          reader.readAsBinaryString(file);
        }
      }
    }

    async function handleReaderLoaded(readerEvt: any) {
      const binaryString = readerEvt.target.result;
      const base64textString = btoa(binaryString);
      let newState = { ...state };
      let newImageSrc = urlImage.current + base64textString;
      newState.originImageSrc = urlImage.current + base64textString;
      if (configuration.compressInitial) {
        newState = {
          ...newState,
          quality: Math.min(configuration.compressInitial || 92, 100),
          maintainAspectRatio: true,
          format: "jpeg",
        };
        let result = await convertImageUsingCanvas(
          newState.originImageSrc as string,
          false,
          newState,
          { getDimFromImage: true }
        );
        setState(result.state);
        setImageSrc(result.imageUri);
        setLoadImage(true);
      } else {
        let img = document.createElement("img");
        img.src = newImageSrc;
        img.onload = () => {
          newState.arrayCopiedImages = [];
          newState.maxHeight = img.height;
          newState.maxWidth = img.width;
          newState.format = fileType.current.split("image/")[1];
          newState.arrayCopiedImages.push({
            lastImage: newImageSrc,
            width: img.width,
            height: img.height,
            quality: newState.quality,
            format: fileType.current.split("image/")[1],
            originImageSrc: newState.originImageSrc as string,
          });
          setState(newState);
          setImageSrc(newImageSrc);
          setLoadImage(true);
        };
      }
    }

    function parseToBase64(
      imageUrl: string
    ): Promise<{ imageUri: string; state: IState }> {
      let newState = { ...state };
      let types = imageUrl.split(".");
      let type = types[types.length - 1];
      if (type && (type == "png" || type == "jpeg" || type == "webp")) {
        type = type;
      } else {
        type = "jpeg";
      }
      newState.format = type;
      if (config.compressInitial != null) {
        let quality = 1;
        if (config.compressInitial >= 0 && config.compressInitial <= 100) {
          quality = config.compressInitial;
        }
        newState.quality = quality;
      }

      return new Promise((resolve, reject) => {
        let img = new Image();
        img.crossOrigin = "Anonymous";
        newState.maxHeight = img.height;
        newState.maxWidth = img.width;

        img.onload = () => {
          let canvas = document.createElement("canvas");
          let ctx: any = canvas.getContext("2d");
          let ratio = 1.0;
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          console.log(newState.quality);
          let dataURI = canvas.toDataURL(
            `image/${type}`,
            newState.quality / 100
          );
          return resolve({
            dataUri: dataURI,
            width: canvas.width,
            height: canvas.height,
          });
        };
        img.onerror = (e: any) => {
          return reject(e.message || `Error loading the src = ${imageUrl}`);
        };
        img.src = imageUrl;
      }).then((data: any) => {
        newState = {
          ...newState,
          maxHeight: data.height,
          maxWidth: data.width,
        };
        return { imageUri: data.dataUri, state: newState };
      });
    }

    function onRemove() {
      setImageSrc(null);
      setLoadImage(false);
      const newState: IState = {
        ...state,
        ...initialState,
      };
      setState(newState);
    }

    const sizeImage = useMemo(() => {
      if (imageSrc && imageSrc.length) {
        return Math.ceil(((3 / 4) * imageSrc.length) / 1024);
      } else {
        return "";
      }
    }, [imageSrc]);

    useEffect(() => {
      processConfig();
    }, [config]);

    useEffect(() => {
      loadImageFromProps();
    }, [imageSrcProp]);

    useEffect(() => {
      imageChanged(imageSrc);
    }, [imageSrc]);

    return (
      <React.Fragment>
        <input
          ref={imagePicker}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          id={"filePicker-" + uuidFilePicker}
          onChange={handleFileSelect}
        />

        {!loadImage && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <div
              style={{
                width: "100%",
                height: 200,
              }}
            >
              <ParentSize>
                {({ width }) => (
                  <Skeleton.Image
                    style={{
                      width: width,
                      height: 200,
                    }}
                  />
                )}
              </ParentSize>
            </div>

            <Button
              icon={<UploadOutlined />}
              title={labels["Upload a image"]}
              onClick={onUpload}
            >
              {labels["Upload a image"]}
            </Button>
          </Space>
        )}

        {loadImage && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <div
              style={{
                width: "100%",
                height: 200,
              }}
            >
              <ParentSize>
                {({ width }) => (
                  <ImageComponent
                    src={imageSrc as string}
                    alt="image-loaded"
                    style={{
                      width,
                      height: 200,
                      objectFit: configuration.objectFit,
                    }}
                  />
                )}
              </ParentSize>
            </div>

            <Space wrap style={{ width: "100%" }}>
              {!configuration.hideAddBtn && (
                <Button
                  icon={<UploadOutlined />}
                  title={labels["Upload a image"]}
                  onClick={onUpload}
                >
                  {labels["Upload a image"]}
                </Button>
              )}

              {!configuration.hideDownloadBtn && (
                <Button
                  icon={<DownloadOutlined />}
                  title={labels["Download the image"]}
                  href={imageSrc as string}
                  download={imageName.current}
                >
                  {labels["Download the image"]}
                </Button>
              )}

              {!configuration.hideDeleteBtn && (
                <Button
                  icon={<DeleteOutlined />}
                  title={labels["Remove"]}
                  onClick={() => onRemove()}
                >
                  {labels["Remove"]}
                </Button>
              )}
            </Space>
          </Space>
        )}
      </React.Fragment>
    );
  }
);

export default ImagePicker;
