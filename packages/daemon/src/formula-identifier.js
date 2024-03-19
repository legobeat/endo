/// <ref types="ses">

const { quote: q } = assert;

export const nodeOrIdPattern = /^[0-9a-f]{128}$/;
const idPattern = /^(?<number>[0-9a-f]{128}):(?<node>[0-9a-f]{128})$/;

/**
 * @param {string} id
 * @param {string} [petName]
 * @returns {void}
 */
export const assertValidId = (id, petName) => {
  if (!idPattern.test(id)) {
    let message = `Invalid formula identifier ${q(id)}`;
    if (petName !== undefined) {
      message += ` for pet name ${q(petName)}`;
    }
    throw new Error(message);
  }
};

/**
 * @param {string} id
 * @returns {import("./types").IdRecord}
 */
export const parseId = id => {
  const match = idPattern.exec(id);
  if (match === null) {
    throw assert.error(`Invalid formula identifier ${q(id)}`);
  }
  const { groups } = match;
  if (groups === undefined) {
    throw assert.error(
      `Programmer invariant failure: expected match groups, formula identifier was ${q(
        id,
      )}`,
    );
  }

  const { number, node } = groups;
  return { number, node };
};

/**
 * @param {import("./types").IdRecord} formulaRecord
 * @returns {string}
 */
export const formatId = ({ number, node }) => {
  const id = `${number}:${node}`;
  assertValidId(id);
  return id;
};
