import React, { useRef, useEffect } from "react";

const AnalogClock = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const size = Math.min(canvas.width, canvas.height);
    const radius = size / 2;
    let rafId;

    const renderClock = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(radius, radius);
      drawFace(ctx, radius);
      drawNumbers(ctx, radius);
      drawHands(ctx, radius);
      rafId = requestAnimationFrame(renderClock);
    };

    renderClock();
    return () => cancelAnimationFrame(rafId);
  }, []);

  const drawFace = (ctx, radius) => {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, 2 * Math.PI);
    ctx.fillStyle = "#06090e";
    ctx.fill();

    const grad = ctx.createRadialGradient(0, 0, radius * 0.9, 0, 0, radius);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
  };

  const drawNumbers = (ctx, radius) => {
    ctx.fillStyle = "#fff";
    ctx.font = `300 ${radius * 0.15}px sans-serif`; // ⚡ lighter font weight
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (let num = 1; num <= 12; num++) {
      const ang = (num * Math.PI) / 6;
      ctx.rotate(ang);
      ctx.translate(0, -radius * 0.8);
      ctx.rotate(-ang);
      ctx.fillText(num.toString(), 0, 0);
      ctx.rotate(ang);
      ctx.translate(0, radius * 0.8);
      ctx.rotate(-ang);
    }
  };

  const drawHands = (ctx, radius) => {
    const now = new Date();
    const hour = now.getHours() % 12;
    const minute = now.getMinutes();
    const second = now.getSeconds() + now.getMilliseconds() / 1000;

    const drawHand = (pos, length, width, color) => {
      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.moveTo(0, 0);
      ctx.rotate(pos);
      ctx.lineTo(0, -length);
      ctx.stroke();
      ctx.rotate(-pos);
    };

    const hourPos = ((hour + minute / 60) * Math.PI) / 6;
    const minutePos = ((minute + second / 60) * Math.PI) / 30;
    const secondPos = (second * Math.PI) / 30;

    drawHand(hourPos, radius * 0.5, radius * 0.02, "#fff");    // ⚡ thinner hour hand
    drawHand(minutePos, radius * 0.75, radius * 0.03, "#E43941"); // ⚡ thinner minute hand
    drawHand(secondPos, radius * 0.80, radius * 0.01, "#fff");  // ⚡ thinner second hand
  };

  return (
    <canvas
      ref={canvasRef}
      width={250}
      height={250}
      style={{ display: "block", margin: "0 auto" }}
    />
  );
};

export default AnalogClock;
