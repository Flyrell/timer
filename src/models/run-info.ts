interface SuccessRunInfo {
    id: string;
    status: 'success';
    reactionTime: number; // in ms
}

interface ErrorRunInfo {
    id: string;
    status: 'error';
    reactionTime: number; // in ms (how much too soon)
}

interface TimeoutRunInfo {
    id: string;
    status: 'timeout';
}

export type RunInfo = SuccessRunInfo | ErrorRunInfo | TimeoutRunInfo;
