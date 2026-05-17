const fs = require("fs");
const path = "src/components/today/TodayView.tsx";
let c = fs.readFileSync(path, "utf8");
const divClose = "</" + "div>";

for (const tag of ["motionStatCard", "motionSection", "motionFooter"]) {
  c = c.replace(new RegExp(`</${tag}>`, "gi"), divClose);
}

c = c.replace(/<motionHeader\b/g, "<TodayHeader");
c = c.replace(/function motionHeader\b/g, "function TodayHeader");
c = c.replace(/<motionFooter\b/g, "<TodayFooter");
c = c.replace(/function motionFooter\b/g, "function TodayFooter");

fs.writeFileSync(path, c);
console.log("fixed TodayView.tsx");
