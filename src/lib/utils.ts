/// <reference types="@webgpu/types" />

export async function detectWebGPU() {
	try {
		const adapter = await navigator.gpu.requestAdapter();
		return !!adapter;
	} catch {
		return false;
	}
}

function encodeWAV(samples: Float32Array, rate: number): ArrayBuffer {
	let offset = 44;
	const buffer = new ArrayBuffer(offset + samples.length * 4);
	const view = new DataView(buffer);

	const writeString = (view: DataView, offset: number, string: string) => {
		for (let i = 0; i < string.length; ++i) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	};

	/* @wc-ignore */ writeString(view, 0, 'RIFF');
	view.setUint32(4, 36 + samples.length * 4, true);
	/* @wc-ignore */ writeString(view, 8, 'WAVE');
	/* @wc-ignore */ writeString(view, 12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 3, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, rate, true);
	view.setUint32(28, rate * 4, true);
	view.setUint16(32, 4, true);
	view.setUint16(34, 32, true);
	writeString(view, 36, 'data');
	view.setUint32(40, samples.length * 4, true);

	for (let i = 0; i < samples.length; ++i, offset += 4) {
		view.setFloat32(offset, samples[i], true);
	}

	return buffer;
}

function saveBlob(filename: string, blob: Blob) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export class RawAudio {
	audio: Float32Array;
	sampling_rate: number;

	constructor(audio: Float32Array, sampling_rate: number) {
		this.audio = audio;
		this.sampling_rate = sampling_rate;
	}

	toWav(): ArrayBuffer {
		return encodeWAV(this.audio, this.sampling_rate);
	}

	toBlob(): Blob {
		const wav = this.toWav();
		const blob = new Blob([wav], { type: 'audio/wav' });
		return blob;
	}

	async save(path: string): Promise<void> {
		saveBlob(path, this.toBlob());
	}
}
