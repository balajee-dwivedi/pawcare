import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { pipeline, RawImage, env } from '@huggingface/transformers';

// Ensure an invalid/expired HF_TOKEN in .env doesn't cause 401 Unauthorized on public models.
delete process.env.HF_TOKEN;
delete process.env.HUGGING_FACE_HUB_TOKEN;
env.allowRemoteModels = true;

const MODEL_ID = process.env.ANIMAL_MODEL_ID || 'Xenova/resnet-50';

// ImageNet classes 0 to 397 are animals. Classes 398 and up are objects.
const ANIMAL_MAX_INDEX = 397;

// Tune these after testing with real PawCare uploads.
const BLUR_THRESHOLD = Number(process.env.BLUR_THRESHOLD || 60);
const APPROVE_CONFIDENCE = Number(process.env.APPROVE_CONFIDENCE || 0.7);

let classifierPromise = null;
let animalLabels = new Set();

// Load the model once and reuse it. The first call downloads it.
function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = pipeline('image-classification', MODEL_ID)
      .then((classifier) => {
        const id2label = classifier.model.config.id2label;
        animalLabels = new Set(
          Object.entries(id2label)
            .filter(([index]) => Number(index) <= ANIMAL_MAX_INDEX)
            .map(([, label]) => label)
        );
        return classifier;
      })
      .catch((err) => {
        // Reset so a transient network failure can retry on the next upload.
        classifierPromise = null;
        throw err;
      });
  }
  return classifierPromise;
}

// Blur score: variance of a Laplacian-filtered grayscale image.
// Low variance means few sharp edges, which usually means a blurry photo.
async function blurScore(imageBuffer) {
  const { channels } = await sharp(imageBuffer)
    .grayscale()
    .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] })
    .stats();
  return channels[0].stdev ** 2;
}

/**
 * Checks an uploaded image file.
 * Returns { status, reason, suggestedSpecies?, confidence?, fileHash }
 * status is one of: 'approved', 'pending_review', 'rejected'
 */
export async function checkAnimalImage(filePath) {
  // Normalize size and rotation so the scores are consistent.
  const jpeg = await sharp(filePath)
    .rotate()
    .resize({ width: 1024, withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();

  // Hash the original file, used later to detect repeat uploads.
  const fileHash = crypto
    .createHash('sha256')
    .update(await fs.promises.readFile(filePath))
    .digest('hex');

  // 1. Blur check
  const blur = await blurScore(jpeg);
  if (blur < BLUR_THRESHOLD) {
    return {
      status: 'rejected',
      reason: 'The photo is too blurry. Please upload a clearer picture.',
      fileHash,
    };
  }

  // 2. Animal check
  let results;
  try {
    const classifier = await getClassifier();
    const image = await RawImage.fromBlob(new Blob([jpeg], { type: 'image/jpeg' }));
    results = await classifier(image, { top_k: 10 });
  } catch (error) {
    console.error('AI animal check unavailable, routing to manual review:', error.message);
    return {
      status: 'pending_review',
      reason: 'Photo queued for manual review.',
      fileHash,
    };
  }

  const topAnimal = results.find((result) => animalLabels.has(result.label));

  if (!topAnimal) {
    return {
      status: 'rejected',
      reason: 'No animal was detected in this photo. Please upload a photo of the animal.',
      fileHash,
    };
  }

  // 3. Decide based on confidence
  const confident = topAnimal.score >= APPROVE_CONFIDENCE;

  return {
    status: confident ? 'approved' : 'pending_review',
    reason: confident ? 'Animal detected.' : 'Needs a quick review by our team.',
    suggestedSpecies: topAnimal.label,
    confidence: Number(topAnimal.score.toFixed(2)),
    fileHash,
  };
}

export function warmupClassifier() {
  getClassifier().catch((err) =>
    console.error('Background AI model warmup failed:', err.message)
  );
}