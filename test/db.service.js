import bcrypt from 'bcryptjs';
import objectPath from 'object-path';
import { PASSWORD_SALT } from '../src/utils.js';

export const db = {};
let currentId = 0;

export const name = 'db';

export const actions = {
  async create({ data, tableName }) {
    db[tableName] ||= {};
    db[tableName][++currentId] = {
      id: currentId,
      ...data,
    };
    return db[tableName][currentId];
  },

  async find({ tableName }) {
    return {
      data: [db[tableName][Object.keys(db[tableName])[0]]],
    };
  },

  async get({ id, tableName }) {
    return db[tableName][id];
  },

  async update({ id, set, tableName }) {
    const doc = db[tableName][id];
    for (const objPath in set) objectPath.set(doc, objPath, set[objPath]);
    return doc;
  },
};
