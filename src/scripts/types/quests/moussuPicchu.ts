export interface QuestMoussuPicchu {
    elements: {
        wind: ElementIndicator
        rain: ElementIndicator
        storm: {
            level: 'none' | ElementLevel
        }
    }
}

interface ElementIndicator {
    level: ElementLevel
}

type ElementLevel = 'low' | 'medium' | 'high' | 'max';
