import HybridsElement from "~hybrids-element";
import { Hybrids, render, html, Descriptor, property, svg } from "hybrids";
import { ref } from "~utils";

interface XChart extends HybridsElement {
  canvas: HTMLCanvasElement,
  data: number[],
  color: string,
}

type Point = [number, number]

const lineCommand = (point: Point) => `L ${point[0]} ${point[1]}`

const line = (pointA: Point, pointB: Point) => {
  const lengthX = pointB[0] - pointA[0]
  const lengthY = pointB[1] - pointA[1]
  return {
    length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
    angle: Math.atan2(lengthY, lengthX)
  }
}

const controlPoint = (current: Point, previous: Point, next: Point, reverse: boolean = false) => {
  const p = previous || current
  const n = next || current
  const smoothing = 0.2
  const o = line(p, n)
  const angle = o.angle + (reverse ? Math.PI : 0)
  const length = o.length * smoothing
  const x = current[0] + Math.cos(angle) * length
  const y = current[1] + Math.sin(angle) * length
  return [x, y]
}

const bezierCommand = (point: Point, i: number, a: Point[]) => {
  const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
  const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
  return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`
}

function svgPath(data: number[], command: (p: Point, ind: number, arr: Point[]) => string = lineCommand): string {
  const length = data.length;
  return data.map((val, i) => [i / (length - 1), 1 - val] as Point).reduce<string[]>((acc, point, i, a) =>
    i === 0 ? [`M 0 1`, `L ${point[0]},${point[1]}`] : [...acc, `${command(point, i, a)}`], []
  ).join(' ') + " L 1 1 z";
}

export default {
  canvas: ref("canvas"),
  color: property("black"),
  type: property("line"),
  data: property([0.2, 0.6, 0.8, 0.4, 0.7, 0.1, 1.0]),
  render: render(({ data, color }) => svg`
    <svg width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">
      <path d=${svgPath(data, bezierCommand)} fill=${color} />
    </svg>
  `.style(`:host { display: flex }`))
} as Hybrids<XChart>;