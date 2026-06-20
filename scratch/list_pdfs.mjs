import * as fs from "fs";
import * as path from "path";

const pdfsDir = "C:\\Users\\susanna\\OneDrive\\Desktop\\pdfs";
if (!fs.existsSync(pdfsDir)) {
    console.log("No pdfs dir at Desktop");
} else {
    function walk(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath);
            } else {
                console.log(path.relative(pdfsDir, fullPath));
            }
        }
    }
    walk(pdfsDir);
}
