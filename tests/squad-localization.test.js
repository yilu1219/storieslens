const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Story Squad keeps interface language separate from story language", () => {
  const html = read("squad-board.html");
  const script = read("squad-board.js");
  const styles = read("squad-board-locale.css");

  assert(html.includes('data-squad-locale="en"') && html.includes('data-squad-locale="zh"'), "the board should expose one compact language switch");
  assert(script.includes("storieslens_squad_ui_${squad.id}"), "each squad should remember its own interface language");
  assert(script.includes('localizedBeat(STORY_BEATS[index], squad.language)'), "creative prompts should continue to follow the project story language");
  assert(script.includes('ui("Owner", "发起人")') && script.includes('ui("Approve & share", "批准并共享")'), "dynamic controls should render in one interface language");
  assert(!script.includes("squad.language = interfaceLocale"), "changing the interface must not rewrite the story language");
  assert(styles.includes('[aria-pressed="true"]'), "the selected interface language should be visibly active");
});
