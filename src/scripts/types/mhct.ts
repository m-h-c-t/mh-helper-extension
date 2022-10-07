export interface IntakeMessage {
    extension_version: number;
    user_id: number;
    entry_id: number;
    mouse: string;
    location: string | null;
    stage: any;
    trap: TrapComponent;
    base: TrapComponent;
    cheese: TrapComponent;
    charm: TrapComponent;
}

interface TrapComponent {
    id: number,
    name: string
}
