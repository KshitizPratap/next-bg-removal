"use client"

import { useEffect, useState, useCallback, useMemo } from "react";
import classes from "@/app/page.module.css";
import { Roboto, Montserrat } from "next/font/google";
import imglyRemoveBackground from "@imgly/background-removal";
import classNames from "classnames";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "300"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700", "500"],
});

const STATUS_MESSAGES = {
  idle: "",
  init: "Initializing...",
  fetching: "Downloading: Assets",
  processing: "Processing: Removing image background",
  done: "",
  error: "Error: Removing image background",
};

const PROCESSING_STATUS = ["init", "fetching", "processing"];

export default function RemoveBG() {
  const [stopwatch, setStopwatch] = useState(0);
  const [status, setStatus] = useState("idle");
  const processMessage = useMemo(() => STATUS_MESSAGES[status], [status]);
  const [hasProcessedImage, setHasProcessedImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [originalImageUrl, setOriginalImageUrl] = useState();
  const [inferenceTime, setInferenceTime] = useState(0);
  const isProcessing = PROCESSING_STATUS.includes(status);

  useEffect(() => {
    let timerInstance;

    if (isProcessing) {
      timerInstance = setInterval(() => {
        setStopwatch((time) => time + 0.01);
      }, 10);
    } else {
      clearInterval(timerInstance);
      setStopwatch(0);
    }

    return () => clearInterval(timerInstance);
  }, [isProcessing, processMessage]);

  // const processImage = useCallback(async (path) => {
  //   try {
  //     setOriginalImageUrl(path);

  //     const startTime = Date.now();

  //     setStatus("init");

  //     const config = {
  //       output: {
  //         format: "image/png",
  //         quality: 1,
  //       },
  //     };

  //     const imglyRemoveBackground = await import("@imgly/background-removal");

  //     await imglyRemoveBackground.default(path, config).then((blob) => {
  //       const url = URL.createObjectURL(blob);
  //       const timeDiffInSeconds = (Date.now() - startTime) / 1000;
  //       setInferenceTime(timeDiffInSeconds);
  //       setHasProcessedImage(true);
  //       setImageUrl(url);
  //       setStatus("idle");
  //     });
  //   } catch (e) {
  //     setHasProcessedImage(true);
  //     console.log("[error]", e);
  //   }
  // }, []);

  const processImage = useCallback(async (path) => {
    setOriginalImageUrl(path);

    const response = await fetch(path);
    const blob = await response.blob();
    const startTime = Date.now();

    setStatus("init");
    imglyRemoveBackground(blob).then((blob) => {
      // The result is a blob encoded as PNG. It can be converted to an URL to be used as HTMLImage.src
      const url = URL.createObjectURL(blob);
      const timeDiffInSeconds = (Date.now() - startTime) / 1000;
      setInferenceTime(timeDiffInSeconds);
      setHasProcessedImage(true);
      // setImageUrl(URL.createObjectURL(url));
      setImageUrl(url);
      setStatus("idle");
    });
  }, []);

  return (
    <>
      <div className={classes.mainContainer}>
        <div className={classes.heroSection}>
          <div className={classes.heroContent}>
            <h1 className={roboto.className}>Remove Image Background</h1>
            <h3 className={montserrat.className}>
              Easily remove the background from photos, then edit them in our
              Image Editor where you can add new backgrounds, graphics, and
              more.
            </h3>
            <label
              className={[classes.startButton, roboto.className].join(" ")}
            >
              Upload Image
              <input
                className={classes.hidden}
                type="file"
                onChange={(event) => {
                  const [file] = event.target.files;
                  const objectURL = URL.createObjectURL(file);

                  processImage(objectURL);
                }}
                accept="image/png, image/jpeg"
              />
            </label>
          </div>
          <video
            autoPlay
            loop
            muted
            style={{ width: "500px", height: "500px", borderRadius: "5px" }}
          >
            <source src="/bg-remove_2.mp4" />
          </video>
        </div>

        {(hasProcessedImage || isProcessing) && (
          <h2 className={[classes.bgHeading, montserrat.className].join(" ")}>
            Here your image
          </h2>
        )}

        <div className={classes.bgRemovalContainer}>
          {isProcessing && (
            <img
              className={classNames(classes.imagePreview, classes.blurred)}
              style={{
                opacity: 1,
              }}
              src={originalImageUrl}
              alt={"Uploaded Image"}
            />
          )}

          {(hasProcessedImage && !isProcessing) && (
            <>
              <img
                className={classNames(classes.imagePreview, {
                  [classes.blurred]: isProcessing,
                })}
                style={{
                  opacity: 1,
                }}
                src={imageUrl}
                alt={"Processed Image"}
              />
            </>
          )}

          {isProcessing && processMessage && (
            <div className={classes.processingOverlay}>
              <p className={[classes.processMessage, montserrat.className].join(' ')}>{processMessage}</p>
              {isProcessing && (
                <p className={[classes.processStatus, montserrat.className].join(' ')}>
                  {stopwatch.toFixed(2) + "s"}
                  {inferenceTime !== 0 && "/" + inferenceTime.toFixed(2) + "s"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
