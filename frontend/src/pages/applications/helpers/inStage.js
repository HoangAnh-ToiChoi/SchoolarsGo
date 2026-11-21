export const inStage = (stage, application) => !stage.statuses || stage.statuses.includes(application.status);
