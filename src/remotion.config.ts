import { Config } from "@remotion/cli/config";

/**
 * Remotion Configuration
 *
 * Note: No webpack fallbacks needed!
 * The src/ directory now contains only pure React/Remotion code.
 * Node.js operations (fs, path, child_process) are in render.mjs.
 */

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer("angle");
Config.setDelayRenderTimeoutInMilliseconds(60000);
