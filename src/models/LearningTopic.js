module.exports = (sequelize, DataTypes) => {
  const LearningTopic = sequelize.define('LearningTopic', {
    titulo:      { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    orden:       { type: DataTypes.INTEGER, defaultValue: 0 },
    publico:     { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'learning_topics' });

  LearningTopic.associate = (models) => {
    LearningTopic.hasMany(models.LearningLesson, { as: 'lessons', foreignKey: 'topicId' });
  };

  return LearningTopic;
};
