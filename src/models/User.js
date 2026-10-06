const { query } = require('../db');

const USER_COLUMNS = `
  id,
  first_name AS "firstName",
  last_name AS "lastName",
  email,
  phone,
  age,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const User = {
  async findAll() {
    const { rows } = await query(
      `SELECT ${USER_COLUMNS} FROM users ORDER BY created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ firstName, lastName, email, phone = null, age = null }) {
    const { rows } = await query(
      `INSERT INTO users (first_name, last_name, email, phone, age)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${USER_COLUMNS}`,
      [firstName, lastName, email.toLowerCase().trim(), phone, age]
    );
    return rows[0];
  },

  async updateById(id, fields) {
    const fieldMapping = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      age: 'age',
    };

    const updates = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(fields)) {
      if (fieldMapping[key]) {
        updates.push(`${fieldMapping[key]} = $${idx}`);
        values.push(key === 'email' ? val.toLowerCase().trim() : val);
        idx++;
      }
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const { rows } = await query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${idx}
       RETURNING ${USER_COLUMNS}`,
      values
    );
    return rows[0] || null;
  },

  async deleteById(id) {
    const { rows } = await query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = User;
