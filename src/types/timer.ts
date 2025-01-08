export type Timer = {
    id: string;       // タイマーの一意なID
    name: string;     // タイマーの名前
    memo: string;     // タイマーのメモ
    timeLeft: number; // 残り時間（秒単位）
    isRunning: boolean; // タイマーが動作中か
    color: string;    // タイマーの背景色
  };
  