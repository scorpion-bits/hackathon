#!/usr/bin/env python3
"""Música de fundo e efeitos sonoros do vídeo-vitrine (sintetizados aqui, sem áudio de terceiros) e mux no vídeo SEM recodificar a imagem.
Os tempos seguem pitch/video/promo.html (popSpan, wipe, queda do mascote, recursos a cada 1,95 s, confete).
Uso: python3 pitch/scripts/make_sfx.py   → pitch/video/sfx.wav + áudio dentro de assets/video/agrobits-showcase.{mp4,webm}
Requer numpy e ffmpeg. Rodar de novo é seguro: sempre parte do vídeo sem som (stream de vídeo copiado).
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR, DUR = 48000, 24.0
out = np.zeros((int(SR * (DUR + 1)), 2))
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=.004, r=None):
    e = np.ones(n)
    na = max(1, int(SR * a)); e[:na] = np.linspace(0, 1, na)
    if r is None:
        e *= np.exp(-np.linspace(0, 6, n))
    return e


def add(at, sig, gain=1.0, pan=0.0):
    i = int(at * SR)
    sig = sig[: max(0, len(out) - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[i:i + len(sig), 0] += sig * gain * l * 1.41
    out[i:i + len(sig), 1] += sig * gain * r * 1.41


def pop(f=900, d=.09):  # bolha: senoide com queda rápida de altura
    t = t_(d); fr = f * (1 + 1.2 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(len(t))


def tick(f=2400, d=.03):
    t = t_(d); return (np.sin(2 * np.pi * f * t) + .3 * rng.standard_normal(len(t))) * np.exp(-t * 160)


def whoosh(d=.55, rise=True):  # ruído filtrado com varredura (passa-baixa de 1 polo móvel)
    n = int(SR * d); x = rng.standard_normal(n); y = np.zeros(n); s = 0.0
    k = np.linspace(.02, .35, n) if rise else np.linspace(.35, .02, n)
    for i in range(n):
        s += k[i] * (x[i] - s); y[i] = s
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return y * e * 2.2


def thud(d=.35):
    t = t_(d); fr = 120 * np.exp(-t * 9) + 45
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 11)


def boing(d=.45):
    t = t_(d); fr = 260 + 140 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 5) + 200 * t
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 6)


def chime(freqs, d=1.2, decay=3.5):
    t = t_(d); s = sum(np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 2 * f * t) for f in freqs)
    return s / len(freqs) * env(len(t), a=.006) ** 0 * np.exp(-t * decay) * np.minimum(1, t / .006)


# cena 1 (0–2,3): "Toda roça tem perguntas." + balões de pergunta
for i in range(4): add(.12 + i * .2, pop(700 + i * 90), .55, -.3 + i * .2)
for i in range(3): add(.95 + i * .16, pop(1250 + i * 120, .07), .35, (-1) ** i * .6)
# viradas de cena (círculo que abre)
for at in (2.05, 4.15, 18.95, 21.55): add(at - .05, whoosh(), .16)
# cena 2: "O governo tem as respostas." + bases caindo e sendo sugadas
for i in range(3): add(2.45 + i * .2, pop(820 + i * 110), .55)
for i in range(9): add(2.85 + i * .06, tick(2000 + 150 * i), .25, -.8 + i * .2)
add(3.95, whoosh(.45, rise=True), .18); add(4.32, pop(1600, .12), .4)
# cena 3: mascote cai, frase, pulinho, logo vai para o canto
add(4.85, thud(), .9); add(4.85, tick(900, .05), .3)
for i in range(4): add(5.05 + i * .17, pop(760 + i * 80), .5)
add(6.0, boing(), .45)
add(6.55, pop(1100, .1), .45)
# cena 4 (7,2–19): seis recursos, um a cada 1,95 s
for i in range(6):
    at = 7.2 + i * 1.95
    add(at - .08, whoosh(.3, rise=False), .08, .4)
    add(at + .05, chime([660 * 2 ** (i / 12 * 2)], .5, 7), .22)
add(18.0, chime([988, 1319], .9, 4), .35)  # notificação: o caso chega ao técnico
# cena 5: "Leva o agrônomo / até quem nunca / teve um."
for i in range(3): add(19.3 + i * .36, pop(520 + i * 70, .12), .6)
add(19.3, thud(.5), .35)
# cena 6: mascote, marca, confete, frase final
add(21.75, thud(), .7)
add(22.35, pop(600, .16), .7); add(22.35, chime([523, 659, 784], 1.4, 2.2), .3)
for i in range(26): add(22.45 + rng.uniform(0, .5), tick(rng.uniform(2500, 5200), .025), .16, rng.uniform(-1, 1))
add(22.8, chime([523, 659, 784, 1047], 1.6, 1.8), .35)

# eco curto (espaço) nos efeitos
fx = out[: int(SR * DUR)].copy()
for dly, g in ((.11, .25), (.23, .12)):
    k = int(SR * dly); fx[k:] += fx[:-k][:, ::-1] * g
fx = np.tanh(fx * 1.1); fx /= np.max(np.abs(fx))

# música de fundo (sintetizada): 120 bpm, 12 compassos de 2 s, C–G–Am–F; o último compasso (22 s) resolve em Dó
BPM = 120; BEAT = 60 / BPM; N = int(SR * DUR)
mus = np.zeros((N, 2))
CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
hz = lambda m: 440 * 2 ** ((m - 69) / 12)  # noqa: E731


def put(at, sig, g, pan=0.0):
    i = int(at * SR); sig = sig[: max(0, N - i)]
    mus[i:i + len(sig), 0] += sig * g * (1 - pan) ; mus[i:i + len(sig), 1] += sig * g * (1 + pan)


def pluck(f, d=.35):  # corda dedilhada simples (duas harmônicas, ataque rápido)
    t = t_(d); return (np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 9) * np.minimum(1, t / .004)


def pad(fs, d):
    t = t_(d); e = np.minimum(1, t / .25) * np.minimum(1, (d - t) / .3)
    return sum(np.sin(2 * np.pi * f * t) + .2 * np.sin(2 * np.pi * f * 1.005 * t) for f in fs) / len(fs) * e


def kick():
    t = t_(.18); return np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-t * 35)) / SR) * np.exp(-t * 18)


def hat():
    t = t_(.05); return rng.standard_normal(len(t)) * np.exp(-t * 90)


for bar in range(12):
    at = bar * 4 * BEAT
    ch = [60, 64, 67] if bar == 11 else CH[bar % 4]
    put(at, pad([hz(m) for m in ch], 4 * BEAT if bar < 11 else 2.0), .18)
    put(at, pluck(hz(ch[0] - 24), .9), .35)  # baixo
    if bar == 11:
        continue
    for k, m in enumerate([ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]]):  # arpejo em colcheias
        put(at + k * BEAT / 2, pluck(hz(m + 12)), .16, .3 if k % 2 else -.3)
    if bar >= 1:  # batida entra no 2º compasso
        for b in range(4):
            put(at + b * BEAT, kick(), .32); put(at + b * BEAT + BEAT / 2, hat(), .05, .2)
mus /= np.max(np.abs(mus))
mus[: int(SR * .6)] *= np.linspace(0, 1, int(SR * .6))[:, None]

mix = fx * .8 + mus * .42
mix = np.tanh(mix * 1.05); mix = mix / np.max(np.abs(mix)) * 0.88
fade = int(SR * .5); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]

wav = ROOT / 'video' / 'sfx.wav'
with wave.open(str(wav), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())

vid = ROOT / 'assets' / 'video'
ff = ['ffmpeg', '-y', '-loglevel', 'error']
for ext, codec in (('mp4', ['-c:a', 'aac', '-b:a', '160k']), ('webm', ['-c:a', 'libopus', '-b:a', '128k'])):
    src, tmp = vid / f'agrobits-showcase.{ext}', vid / f'agrobits-showcase.tmp.{ext}'
    subprocess.run(ff + ['-i', str(src), '-i', str(wav), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', *codec, '-shortest',
                         *(['-movflags', '+faststart'] if ext == 'mp4' else []), str(tmp)], check=True)
    tmp.replace(src)
print('ok →', wav, '+ áudio no mp4 e no webm (vídeo copiado, sem recodificar)')
