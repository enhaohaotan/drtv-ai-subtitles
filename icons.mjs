// SVG paths inherit DRTV's native hover and selected fills, including three-letter codes.
const glyphs={
 A:'M3 0h2l3 12H5.8l-.6-2.6H2.8L2.2 12H0L3 0zm1 3.5L3.2 7h1.6L4 3.5z',
 B:'M0 0h4c2.5 0 3.5 1.2 3.5 3 0 1.3-.6 2.2-1.6 2.7C7.3 6.1 8 7.1 8 8.6 8 10.8 6.7 12 4.1 12H0V0zm2 2v3h1.8c1.2 0 1.7-.5 1.7-1.5S5 2 3.8 2H2zm0 5v3h2c1.3 0 2-.4 2-1.5S5.3 7 4 7H2z',
 C:'M8 1 6.8 2.7C6 2.1 5.5 2 4.7 2 3 2 2 3.3 2 6s1 4 2.7 4c.8 0 1.3-.1 2.1-.7L8 11c-1 .8-2 1-3.3 1C1.7 12 0 9.9 0 6s1.7-6 4.7-6C6 0 7 .2 8 1z',
 D:'M0 0h3C6.4 0 8 2 8 6s-1.6 6-5 6H0V0zm2 2v8h1c2 0 3-1.3 3-4S5 2 3 2H2z',
 E:'M0 0h8v2H2v3h5v2H2v3h6v2H0V0z',
 F:'M0 0h8v2H2v3h5v2H2v5H0V0z',
 G:'M8 1 6.8 2.7C6 2.1 5.5 2 4.7 2 3 2 2 3.3 2 6s1 4 2.7 4c.5 0 1-.1 1.3-.3V7H4V5h4v6c-1 .7-2 1-3.3 1C1.7 12 0 9.9 0 6s1.7-6 4.7-6C6 0 7 .2 8 1z',
 H:'M0 0h2v5h4V0h2v12H6V7H2v5H0V0z',
 I:'M1 0h6v2H5v8h2v2H1v-2h2V2H1V0z',
 J:'M2 0h6v8.5C8 11 6.7 12 4 12s-4-1.3-4-4h2c0 1.5.6 2 2 2s2-.5 2-1.5V2H2V0z',
 K:'M0 0h2v5l3.6-5H8L4.1 5.6 8 12H5.6L2.8 7.3 2 8.4V12H0V0z',
 L:'M0 0h2v10h6v2H0V0z',
 M:'M0 0h2l2 5 2-5h2v12H6V4.8L4 9 2 4.8V12H0V0z',
 N:'M0 0h2l4 7.5V0h2v12H6L2 4.5V12H0V0z',
 O:'M4 0c2.7 0 4 2 4 6s-1.3 6-4 6S0 10 0 6 1.3 0 4 0zm0 2C2.6 2 2 3.3 2 6s.6 4 2 4 2-1.3 2-4-.6-4-2-4z',
 P:'M0 0h4c2.7 0 4 1.3 4 4S6.7 8 4 8H2v4H0V0zm2 2v4h2c1.4 0 2-.6 2-2s-.6-2-2-2H2z',
 Q:'M4 0c2.7 0 4 2 4 6 0 2-.3 3.5-1 4.5L8 12H5.5l-.4-.4c-.3.3-.7.4-1.1.4C1.3 12 0 10 0 6s1.3-6 4-6zm0 2C2.6 2 2 3.3 2 6s.6 4 2 4l-1-1.5 1.6-1L5.5 9c.3-.7.5-1.7.5-3 0-2.7-.6-4-2-4z',
 R:'M0 0h4c2.7 0 4 1.3 4 3.7 0 1.8-.7 3-2.2 3.5L8 12H5.7L3.8 7.5H2V12H0V0zm2 2v3.5h2c1.4 0 2-.5 2-1.8S5.4 2 4 2H2z',
 S:'M8 1 6.8 2.6C6 2.1 5.3 2 4.2 2 2.7 2 2 2.4 2 3.3 2 4 2.6 4.4 4.5 5c2.5.8 3.5 1.8 3.5 3.7C8 10.8 6.5 12 3.8 12 2.2 12 1 11.6 0 10.8l1.2-1.6C2 9.8 2.8 10 3.8 10 5.3 10 6 9.6 6 8.7 6 8 5.4 7.6 3.5 7 1 6.2 0 5.2 0 3.3 0 1.2 1.5 0 4.2 0 5.8 0 7 .3 8 1z',
 T:'M0 0h8v2H5v10H3V2H0V0z',
 U:'M0 0h2v8c0 1.4.6 2 2 2s2-.6 2-2V0h2v8c0 2.7-1.3 4-4 4S0 10.7 0 8V0z',
 V:'M0 0h2.2L4 8.5 5.8 0H8L5 12H3L0 0z',
 W:'M0 0h2l.5 8L4 4l1.5 4L6 0h2L7 12H5L4 8l-1 4H1L0 0z',
 X:'M0 0h2.4L4 3.8 5.6 0H8L5.2 6 8 12H5.6L4 8.2 2.4 12H0l2.8-6L0 0z',
 Y:'M0 0h2.3L4 4.5 5.7 0H8L5 7v5H3V7L0 0z',
 Z:'M0 0h8v2L2.5 10H8v2H0v-2L5.5 2H0V0z'
};
export function languageIcon(code) {
  if(!/^[A-Z]{2,3}$/.test(code))throw Error('Invalid language icon code.');
  const scale=code.length===3?0.625:1;
  const step=code.length===3?6:9;
  const letters=[...code].map((letter,i)=>`<path fill-rule="evenodd" transform="translate(${7.5+i*step} 10) scale(${scale} 1)" d="${glyphs[letter]}"/>`).join('');
  return `<svg class="svg-icon" data-code="${code}" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="M26.667 4H32v24h-5.333v-2.667h2.666V6.667h-2.666V4zM0 4h5.333v2.667H2.667v18.666h2.666V28H0V4z"/>${letters}</svg>`;
}
