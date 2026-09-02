# MaskCheck — Teachable Machine React app

## Set up your model

1. In Teachable Machine, export your image model as **Tensorflow.js**.
2. Copy the exported `model.json`, `metadata.json`, and all `.bin` weight files into `public/model/`.
3. Make sure your classes use intuitive names such as `With Mask`, `Without Mask`, and `Improper Mask`. (The app supports common variants such as `No Mask` and `Incorrect Mask` too.)

## Run locally

```bash
npm install
npm run dev
```

Open the local address shown in the terminal, allow camera access, and choose **Start detection**.

## Build for deployment

```bash
npm run build
```

Camera access requires HTTPS in deployed environments (localhost is also allowed).
