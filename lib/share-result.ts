import { Share, Platform } from 'react-native';

export interface ShareSesiParams {
  userName?: string;
  snbt: number;
  accuracy: number;
  benar: number;
  total: number;
  mapelLabel?: string;
}

/**
 * Share latihan result as plain text (works on iOS & Android without extra native modules).
 */
export async function shareSesiResult(params: ShareSesiParams): Promise<boolean> {
  const name = params.userName?.split(' ')[0] ?? 'Pejuang PTN';
  const mapelLine = params.mapelLabel ? `\n📚 ${params.mapelLabel}` : '';

  const message = [
    `🎯 ${name} baru selesai latihan di AI Lolos PTN!`,
    mapelLine,
    '',
    `📊 Estimasi SNBT: ${params.snbt} / 1000`,
    `✅ Akurasi: ${Math.round(params.accuracy)}%`,
    `📝 Jawaban benar: ${params.benar} dari ${params.total} soal`,
    '',
    'Ayo persiapan SNBT bareng! 💪',
    Platform.OS === 'android' ? '\nhttps://ailolosptn.id' : '',
  ].join('\n');

  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message }
        : { message, title: 'Hasil Latihan SNBT' },
    );
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
