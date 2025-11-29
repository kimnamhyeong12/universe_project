export function renderCellThumbnail(planetImgUrl, cell, gridW = 10, gridH = 10) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const size = 200; // 썸네일 크기
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = planetImgUrl;

    img.onload = () => {
      const cellW = img.width / gridW;
      const cellH = img.height / gridH;

      const [cx, cy] = cell.cellId.split("-").map(Number);

      // 행성에서 해당 Cell 영역 잘라 그리기
      ctx.drawImage(
        img,
        cx * cellW, cy * cellH, cellW, cellH,  // 소스 영역
        0, 0, size, size                       // 썸네일 영역
      );

      // 그 위에 픽셀 그림 덮어쓰기
      const pxW = size / 50;  // CELL_PIXEL_W = 50 기준
      const pxH = size / 50;

      (cell.pixels || []).forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x * pxW, p.y * pxH, pxW, pxH);
      });

      resolve(canvas.toDataURL());
    };
  });
}
