// Don't change without updating the intake
export interface BeanstalkRarityPayload {
    version: number,
    floor: string
    embellishments: {
        golden_key: boolean,
        ruby_remover: boolean,
    },
    room: string,
}
