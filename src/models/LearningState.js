// models/LearningState.js
module.exports = (sequelize, DataTypes) => {
  const LearningState = sequelize.define('LearningState', {
    userId:    { type: DataTypes.INTEGER, allowNull: false },
    videoId:   { type: DataTypes.STRING(128), allowNull: false },
    notes:     { type: DataTypes.TEXT, defaultValue: '' },
    checklist: {
      type: DataTypes.TEXT,       // guardamos JSON como TEXT en SQLite
      defaultValue: '[]',
      get() {
        try { return JSON.parse(this.getDataValue('checklist') || '[]'); }
        catch { return []; }
      },
      set(v) { this.setDataValue('checklist', JSON.stringify(v || [])); }
    }
  }, {
    tableName: 'learning_states',
    indexes: [{ unique: true, fields: ['userId', 'videoId'] }],
    timestamps: true
  });

  return LearningState;
};
