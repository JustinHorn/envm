// // console.log(i);
// console.log(process.env.PWD);

var dbFile = "lol.js";

const openConfigWithNano = (nanoPath: string) => {
  var editorSpawn = require("child_process").spawn("nano", [nanoPath], {
    stdio: "inherit",
    detached: true,
  });

  editorSpawn.on("data", function (data: any) {
    process.stdout.pipe(data);
  });
};
