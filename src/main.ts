import * as dat from 'dat.gui';
import './style.css';

const gui = new dat.GUI();
const dimensions = {
  width: 800,
  height: 600
}

const params = {
  circleRadius: 50,
  circleColor: 'rgba(0, 0, 255, 0.1)',
  triangleColor: 'red',
  backgroundColor: 'white',
  width: 100,
  height: 100,
  posX: window.innerWidth / 2,
  posY: window.innerHeight / 2,
};
const calculatedValues = {
  angleA: 0,
  angleB: 0,
  angleC: 0,
  abcArea: 0,
  circleArea: 0,
  aycArea: 0,
  abcIntersectionCircleArea: 0,
  ayAngles: 0
};

gui.add(params, 'width', 0, 300);
gui.add(params, 'height', 0, 300);
gui.add(params, 'posX', 0, window.innerWidth);
gui.add(params, 'posY', 0, window.innerHeight);
var calculated = gui.addFolder('Calculated values');
calculated.add(calculatedValues, 'angleA').listen();
calculated.add(calculatedValues, 'angleB').listen();
calculated.add(calculatedValues, 'angleC').listen();
calculated.add(calculatedValues, 'abcArea').listen();
calculated.add(calculatedValues, 'circleArea').listen();
calculated.add(calculatedValues, 'aycArea').listen();
calculated.add(calculatedValues, 'abcIntersectionCircleArea').listen();
calculated.add(calculatedValues, 'ayAngles').listen();

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="${dimensions.width}" height="${dimensions.height}"></canvas>
  </div>
`

setupCanvas(document.querySelector<HTMLCanvasElement>('#canvas')!)
function setupCanvas(canvas: HTMLCanvasElement) {
  // Draw a grid for maths visualisation
  const ctx = canvas.getContext('2d')!
  drawScene(ctx)

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  })

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = params.backgroundColor;
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  dimensions.width = window.innerWidth;
  dimensions.height = window.innerHeight;

  console.log(window.innerWidth, window.innerHeight);

  drawGrid(ctx)

  const triangle = calculateRightAngleTriangleVertices(params.posX, params.posY, params.width, params.height);
  const { lines, angles, originalAngles } = drawTriangle(ctx, triangle.ab, triangle.bc, triangle.ca, 'black', 'rgba(0, 0, 0, 0.1)');

  calculatedValues.angleA = angles.a;
  calculatedValues.angleB = angles.b;
  calculatedValues.angleC = angles.c

  // Draw a circle that intersects with the triangle abc on line ab from point C as the center
  const { radius } = drawCircle(ctx, triangle.ca[0], triangle.ca[1], triangle.ab[1] - triangle.ca[1]);

  const angleOfIntersectionA = (180 - angles.c) / 2;
  const areaOfTriangleAYC = Math.round(0.5 * lines.ca * radius * Math.sin(originalAngles.c))
  calculatedValues.ayAngles = angleOfIntersectionA;
  calculatedValues.aycArea = areaOfTriangleAYC;

  const aycLines = {
    ca: triangle.ca,
    cy: [
      triangle.ca[0] + radius * Math.cos(originalAngles.c),
      triangle.ca[1] + radius * Math.sin(originalAngles.c)
    ],
    ay: [
      triangle.ca[0],
      triangle.ab[1],
    ]
  } as {
    ca: [number, number],
    cy: [number, number],
    ay: [number, number]
  }
  drawTriangle(ctx, aycLines.ca, aycLines.cy, aycLines.ay, 'red', 'rgba(0, 0, 255, 0.1)', false);

  // Get the area of the circle
  const circleSliceArea = Math.PI * Math.pow(radius, 2)
  calculatedValues.circleArea = circleSliceArea;
  calculatedValues.abcIntersectionCircleArea = 0.125 * Math.PI * Math.pow(radius, 2)

  // Get the area of the triangle abc
  const triangleArea = Math.abs((triangle.ab[0] * (triangle.ca[1] - triangle.bc[1]) + triangle.ca[0] * (triangle.bc[1] - triangle.ab[1]) + triangle.bc[0] * (triangle.ab[1] - triangle.ca[1])) / 2);
  calculatedValues.abcArea = triangleArea;

  requestAnimationFrame(() => drawScene(ctx));
}

/**
 * Draw a statistic on the canvas.
 * 
 * @param ctx - The canvas rendering context.
 * @param posX - The x position of the text.
 * @param posY - The y position of the text.
 * @param text - The text to display.
 */
function drawStatistic(ctx: CanvasRenderingContext2D, posX: number, posY: number, text: string) {
  ctx.font = '16px Arial';
  ctx.fillStyle = 'green';
  ctx.fillText(text, posX, posY);
}

/**
 * Draw a circle on the canvas.
 * 
 * @param ctx - The canvas rendering context.
 * @param posX - The x position of the center of the circle.
 * @param posY - The y position of the center of the circle.
 * @param radius - The radius of the circle.
 */
function drawCircle(ctx: CanvasRenderingContext2D, posX: number, posY: number, radius: number) {
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fill();
  ctx.closePath();
  ctx.stroke();

  return {
    radius
  }
}

/**
 * Draw a grid on the canvas.
 * 
 * @param ctx - The canvas rendering context.
 */
function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.lineWidth = 1

  for (let i = 0; i < (dimensions.width + 1); i += 25) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, dimensions.height); // Corrected to dimensions.height
    ctx.stroke();
  }

  for (let i = 0; i < (dimensions.height + 1); i += 25) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(dimensions.width, i); // Corrected to dimensions.width
    ctx.stroke();
  }
}

/**
 * Calculate the vertices of a triangle based on the position of the top vertex.
 * 
 * @param posX - The x position of the top vertex.
 * @param posY - The y position of the top vertex.
 * @returns The [x, y] coordinates for vertices A, B, and C.
 */
function calculateRightAngleTriangleVertices(posX: number, posY: number, width: number, height: number): {
  ab: [number, number],
  bc: [number, number],
  ca: [number, number]
} {
  return {
    ab: [posX, posY],
    bc: [posX + width, posY],
    ca: [posX, posY - height],
  };
}

/**
 * Draws a triangle on the canvas.
 * 
 * @param ctx - The canvas rendering context.
 * @param vertexA - The [x, y] coordinates for vertex A.
 * @param vertexB - The [x, y] coordinates for vertex B.
 * @param vertexC - The [x, y] coordinates for vertex C.
 * @param strokeStyle - Optional stroke style for the triangle's outline.
 * @param fillStyle - Optional fill style for the triangle.
 */
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  vertexA: [number, number],
  vertexB: [number, number],
  vertexC: [number, number],
  strokeStyle: string = 'black',
  fillStyle: string = 'transparent',
  renderText: boolean = true
) {
  ctx.beginPath();
  ctx.moveTo(vertexA[0], vertexA[1]); // Move to vertex A
  ctx.lineTo(vertexB[0], vertexB[1]); // Draw line from A to B
  ctx.lineTo(vertexC[0], vertexC[1]); // Draw line from B to C
  ctx.closePath(); // Close path back to vertex A

  // Apply styles
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2;
  ctx.stroke(); // Draw the outline of the triangle

  ctx.fillStyle = fillStyle;
  ctx.fill(); // Fill the triangle

  // Write the values of line ab, bc, ca to the canvas
  const ab = Math.abs(vertexA[0] - vertexB[0]);
  const ca = vertexA[1] - vertexC[1];
  // Calculate the length of the line bc using the Pythagorean theorem
  const bc = Math.round(Math.sqrt(Math.pow(ab, 2) + Math.pow(ca, 2)));
  // Get the angles of the triangle abc in constants a, b and c inside the angles object
  const angles = {
    a: Math.acos((Math.pow(ca, 2) + Math.pow(ab, 2) - Math.pow(bc, 2)) / (2 * ca * ab)),
    b: Math.acos((Math.pow(bc, 2) + Math.pow(ca, 2) - Math.pow(ab, 2)) / (2 * bc * ca)),
    c: Math.acos((Math.pow(ab, 2) + Math.pow(bc, 2) - Math.pow(ca, 2)) / (2 * ab * bc))
  }

  if (renderText) {
    // Draw the names of the lines on the edges of the triangle at the angles of the line
    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('a', vertexA[0] - 10, vertexA[1] + 10);
    ctx.fillText('b', vertexB[0] + 10, vertexB[1] + 10);
    ctx.fillText('c', vertexC[0] - 10, vertexC[1] - 10);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`ab: ${Math.round(ab)}`, vertexB[0] + -(ab / 2), vertexA[1] + 20);
    ctx.fillText(`ca: ${Math.round(ca)}`, vertexC[0] - 60, vertexC[1] + (ca / 2));
    // Place the text in the middle of the line bc
    ctx.fillText(`bc: ${Math.round(bc)}`, vertexA[0] + (ab / 2) + 10, vertexA[1] - (ca / 2));
  }

  return {
    lines: {
      ab,
      bc,
      ca
    },
    angles: {
      a: Math.round(angles.a * 180 / Math.PI),
      b: Math.round(angles.b * 180 / Math.PI),
      c: Math.round(angles.c * 180 / Math.PI)
    },
    originalAngles: angles
  }
}