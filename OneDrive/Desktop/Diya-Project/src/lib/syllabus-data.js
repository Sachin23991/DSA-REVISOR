export const SYLLABUS_DATA = [
    {
        id: 'prelims',
        title: 'Prelims',
        children: [
            {
                id: 'prelims-gs1',
                title: 'General Studies I',
                children: [
                    { id: 'p-gs1-history', title: 'History of India and Indian National Movement' },
                    { id: 'p-gs1-geography', title: 'Indian and World Geography' },
                    { id: 'p-gs1-polity', title: 'Indian Polity and Governance' },
                ]
            },
            {
                id: 'prelims-gs2',
                title: 'CSAT (Paper II)',
                children: [
                    { id: 'p-gs2-comprehension', title: 'Comprehension' },
                    { id: 'p-gs2-logical', title: 'Logical Reasoning' },
                ]
            }
        ]
    },
    {
        id: 'mains',
        title: 'Mains',
        children: [
            {
                id: 'mains-essay',
                title: 'Essay',
                children: []
            },
            {
                id: 'mains-gs1',
                title: 'General Studies I',
                children: [
                    {
                        id: 'm-gs1-culture',
                        title: 'Indian Heritage and Culture',
                        children: [
                            { id: 'm-gs1-art', title: 'Art & Culture' }
                        ]
                    },
                    { id: 'm-gs1-history', title: 'History' },
                    { id: 'm-gs1-geography', title: 'Geography of the World' },
                    { id: 'm-gs1-society', title: 'Society' },
                ]
            },
            {
                id: 'mains-gs2',
                title: 'General Studies II',
                children: [
                    { id: 'm-gs2-polity', title: 'Governance, Constitution, Polity' },
                    { id: 'm-gs2-ir', title: 'International Relations' },
                ]
            },
            {
                id: 'mains-gs3',
                title: 'General Studies III',
                children: [
                    { id: 'm-gs3-tech', title: 'Technology' },
                    { id: 'm-gs3-econ', title: 'Economic Development' },
                    { id: 'm-gs3-env', title: 'Biodiversity & Environment' },
                    { id: 'm-gs3-security', title: 'Security & Disaster Management' },
                ]
            },
            {
                id: 'mains-gs4',
                title: 'General Studies IV',
                children: [
                    { id: 'm-gs4-ethics', title: 'Ethics, Integrity and Aptitude' },
                ]
            }
        ]
    }
];
