import React, { useEffect } from 'react';
import styles from './SplashScreen.module.scss';

const SplashScreen: React.FC = () => {
  useEffect(() => {
    const newParticlesPerFrame = 50;

    const color = (hsl: any, o: number) => {
      return `hsla(${hsl.h | 0}, ${hsl.s}%, ${hsl.l}%, ${o})`;
    };

    class TextSparks {
      opa = 0;
      tick = 0;
      drawCB: (() => void) | null = null;
      mask: any = null;
      canvas: HTMLCanvasElement;
      engine: CanvasRenderingContext2D | null;
      maskTick = 0;
      nextMaskCb = this.nextMask.bind(this);
      maskCache: any[] = [];
      width: number = 0;
      height: number = 0;
      stack: any[] = [];
      stackId = -1;
      particleMap = new Map();

      constructor() {
        this.canvas = window.document.querySelector('canvas') as HTMLCanvasElement;
        this.engine = this.canvas.getContext('2d');

        this.resize();
        this.fetchData();
        this.buildStackCache();

        window.addEventListener('resize', this.resize.bind(this));
      }

      buildStackCache() {
        this.maskCache = this.stack.map((stack) => {
          return this.buildTextMask(stack.texts);
        });
      }

      fetchData() {
        this.stack = Array.from(document.querySelectorAll('div > ul')).map((ul) => {
          return {
            ticks: 0.05 * (ul.hasAttribute('data-time') ? Number(ul.getAttribute('data-time')) : 0),
            fadeIn: ul.hasAttribute('data-fade-in') ? 50 / Number(ul.getAttribute('data-fade-in')) : 0,
            fadeOut: ul.hasAttribute('data-fade-out') ? 50 / Number(ul.getAttribute('data-fade-out')) : 0,
            texts: Array.from(ul.querySelectorAll('li')).map((li) => {
              return {
                text: li.innerHTML.trim(),
                hsl: {
                  h: li.hasAttribute('data-hue') ? Number(li.getAttribute('data-hue')) : 0,
                  s: li.hasAttribute('data-saturation') ? Number(li.getAttribute('data-saturation')) : 100,
                  l: li.hasAttribute('data-lightness') ? Number(li.getAttribute('data-lightness')) : 50,
                },
              };
            }),
          };
        });
      }

      resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.setAttribute('width', this.width.toString());
        this.canvas.setAttribute('height', this.height.toString());
      }

      buildTextMask(texts: any) {
        const mask: any[] = [];

        const textAll = texts.reduce((all: string, textStack: any) => {
          return all.concat(textStack.text);
        }, '');

        const size = 0.8;
        const width = 200;
        const height = width / (this.width / this.height) | 0;
        const baseFontSize = 20;

        const canvas = document.createElement('canvas');
        const engine = canvas.getContext('2d');

        canvas.setAttribute('width', width.toString());
        canvas.setAttribute('height', height.toString());

        const font = (size: number) => {
          return `bold ${size}px Arial`;
        };

        engine!.fillStyle = '#000';
        engine!.font = font(baseFontSize);
        const m = engine!.measureText(textAll);
        const rel = m.width / (width * size);
        const fSize = Math.min(height * 0.8, baseFontSize / rel | 0);

        engine!.font = font(fSize);
        const fontWidth = engine!.measureText(textAll).width;

        engine!.fillText(textAll, (width - fontWidth) / 2, height / 2 + fSize * 0.35);

        let left = (width - fontWidth) / 2;
        const bot = height / 2 + fSize * 0.35;

        Object.values(texts).forEach((textStack: any) => {
          engine!.clearRect(0, 0, width, height);

          engine!.fillText(textStack.text, left, bot);

          left += engine!.measureText(textStack.text).width;

          const data = engine!.getImageData(0, 0, width, height);
          const subStack = [];

          for (let i = 0, max = data.width * data.height; i < max; i++) {
            if (data.data[i * 4 + 3]) {
              subStack.push({
                x: (i % data.width) / data.width,
                y: (i / data.width | 0) / data.height,
                o: Math.random(),
                t: Math.random(),
              });
            }
          }

          mask.push({
            hsl: textStack.hsl,
            s: subStack,
          });
        });

        return mask;
      }

      createNewParticle() {
        for (let i = 0; i < newParticlesPerFrame; i++) {
          let main = Math.random() * this.mask.length | 0;
          let subMask = this.mask[main];
          let maskElement = this.mask[main].s[Math.random() * this.mask[main].s.length | 0];

          if (subMask && maskElement) {
            let particle = {
              x: maskElement.x,
              y: maskElement.y,
              hsl: subMask.hsl,
              c: this.prepareParticle,
            };

            this.particleMap.set(particle, particle);
          }
        }
      }

      clear() {
        if (this.engine) {
          this.engine.fillStyle = '#111';
          this.engine.fillRect(0, 0, this.width, this.height);
        }
      }

      prepareParticle(particle: any) {
        const r1 = Math.random();
        const r2 = Math.random();
        const r3 = Math.random();

        const rad = r3 * Math.PI * 2;

        particle.x += (-0.5 + r1) / 300;
        particle.y += (-0.5 + r2) / 300;
        particle.si = 1 + Math.random() * 4 | 0;

        particle.s = 0.003 + ((r1 + r2) / 2) / 10;
        particle.l = 0;

        particle.mx = Math.cos(rad) * (particle.s / (r1 < 0.05 ? 10 : 400));
        particle.my = Math.sin(rad) * (particle.s / (r1 < 0.05 ? 10 : 400));

        particle.c = this.drawParticle;
      }

      drawParticle(particle: any) {
        if (particle.l >= 1) {
          particle.c = null;
          return;
        }

        particle.l += particle.s;
        particle.x += particle.mx;
        particle.y += particle.my;

        if (this.engine) {
          this.engine.fillStyle = color(particle.hsl, this.opa * Math.sin(particle.l * Math.PI));
          this.engine.fillRect(particle.x * this.width, particle.y * this.height, particle.si, particle.si);
        }
      }

      renderParticles() {
        this.particleMap.forEach((particle) => {
          particle.c.call(this, particle);

          if (!particle.c) {
            this.particleMap.delete(particle);
          }
        });
      }

      drawStatic() {
        let i = 0;
        const step = 0.01;

        this.mask.forEach((subMask: any) => {
          subMask.s.forEach((pos: any) => {
            i++;

            if (this.engine) {
              this.engine.fillStyle = color(subMask.hsl, (1 + Math.cos(pos.x * 5 * pos.y * 5 + this.tick / 10)) / 2 * this.opa * pos.t * 0.5);
              this.engine.fillRect(pos.x * this.width, pos.y * this.height, this.width / 150, this.width / 150);
            }

            if (i % 2) {
              return;
            }

            pos.o += step;
            const opa = Math.max(0, Math.sin(pos.o * Math.PI * 2));
            const padding = opa * this.width / 200;

            if (this.engine) {
              this.engine.fillStyle = color(subMask.hsl, this.opa * opa * 0.2);

              if (pos.t < 0.5) {
                this.engine.beginPath();
                this.engine.arc(pos.x * this.width, pos.y * this.height, this.width / 500 + padding, 0, Math.PI * 2);
                this.engine.fill();
              } else {
                this.engine.fillRect(pos.x * this.width - padding, pos.y * this.height - padding, this.width / 150 + padding * 2, this.width / 150 + padding * 2);
              }
            }
          });
        });
      }

      draw() {
        this.tick++;

        this.nextMaskCb();
        this.createNewParticle();
        this.clear();

        if (this.engine) {
          this.engine.globalCompositeOperation = 'lighter';
        }
        this.drawStatic();
        this.renderParticles();
        if (this.engine) {
          this.engine.globalCompositeOperation = 'source-over';
        }

        requestAnimationFrame(this.drawCB!);
      }

      fadeInMask() {
        this.opa += this.stack[this.stackId].fadeIn;

        if (this.opa >= 1) {
          this.opa = 1;

          this.afterFadeIn();
        }
      }

      afterFadeIn() {
        this.opa = 1;

        if (this.stack[this.stackId].ticks) {
          this.maskTick = 0;
          this.nextMaskCb = this.tickMask.bind(this);
        } else {
          this.nextMaskCb = () => {};
        }
      }

      fadeOutMask() {
        this.opa -= this.stack[this.stackId].fadeOut;

        if (this.opa <= 0) {
          this.afterFadeOut();
        }
      }

      afterFadeOut() {
        this.opa = 0;
        this.nextMaskCb = this.nextMask.bind(this);
      }

      tickMask() {
        this.maskTick++;

        if (this.maskTick >= this.stack[this.stackId].ticks) {
          if (this.stack[this.stackId].fadeOut) {
            this.nextMaskCb = this.fadeOutMask.bind(this);
          } else {
            this.afterFadeOut();
          }
        }
      }

      nextMask() {
        this.stackId++;

        if (this.stackId >= this.stack.length) {
          this.stackId = 0;
        }

        this.mask = this.maskCache[this.stackId];

        if (this.stack[this.stackId].fadeIn) {
          this.nextMaskCb = this.fadeInMask.bind(this);
        } else {
          this.opa = 1;
          this.afterFadeIn();
        }
      }

      run() {
        this.drawCB = this.draw.bind(this);
        this.drawCB();
      }
    }

    const a = new TextSparks();
    a.run();
  }, []);

  return (
    <div className={styles.container}>
      <div>
        <ul data-time="3000">
          <li data-hue="270">2</li>
          <li data-hue="270">7</li>
          <li data-hue="270">0</li>
          <li data-hue="30">/</li>
          <li data-hue="30">3</li>
          <li data-hue="30">0</li>
        </ul>
      </div>
      <canvas></canvas>
    </div>
  );
};

export default SplashScreen;