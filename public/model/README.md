# Teachable Machine model files

Export your Teachable Machine **Image Project** as **Tensorflow.js** and copy every exported file into this folder.

Your folder should look like this:

```
public/model/
  model.json
  metadata.json
  weights.bin
```

If your export has more than one `.bin` file, copy all of them here. The app automatically loads `model.json` and `metadata.json`.
