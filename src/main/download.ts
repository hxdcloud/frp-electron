import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

function downloadFile(url: string, filename: string): void {
    console.log(url);
    const downloadDir = path.join(__dirname, 'frp'); // 定义下载目录

    // 创建下载目录如果不存在
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
    }
    const filePath = path.join(downloadDir, filename);
    console.log(filePath);
    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
        response.pipe(file);

        file.on('finish', () => {
            file.close(() => {
                console.log(`Downloaded: ${filePath}`);
            });
        });
    }).on('error', (err) => {
        fs.unlink(filePath, () => {
            console.error(`Error downloading the file: ${err.message}`);
        });
    });
}
export default downloadFile;