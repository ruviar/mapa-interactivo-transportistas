import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * Registro único de GSAP y sus plugins (todos gratuitos desde la compra de
 * Webflow, sin Club GreenSock). Un módulo lo importa una vez —el cache de ES
 * modules garantiza que `registerPlugin` no se repite— y el resto del código
 * importa desde aquí, igual que la física de Motion vive solo en
 * `resortes.ts`.
 */
gsap.registerPlugin(Draggable, DrawSVGPlugin, Flip, ScrollTrigger, SplitText);

export { Draggable, DrawSVGPlugin, Flip, gsap, ScrollTrigger, SplitText };
