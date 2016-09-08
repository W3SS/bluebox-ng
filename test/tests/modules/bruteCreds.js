// Copyright Jesus Perez <jesusprubio gmail com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

const test = require('tap').test;

const utils = require('../../../lib/utils');
const method = require('../../../lib/modules/bruteCreds.js');
const Server = require('../../lib/sshServer');

const serverCfg = {
  ip: '127.0.0.1',
  port: 1337,
  userName: 'foo',
  password: 'bar',
};
// A SSH server to test the module.
const server = new Server(serverCfg);
const opts = {
  target: serverCfg.ip,
  port: serverCfg.port,
  users: [serverCfg.userName],
  userAsPass: false,
  timeout: 1000,
};


server.start()
.then(() => {
  test('with single valid credential', assert => {
    assert.plan(1);

    opts.passwords = [serverCfg.password];

    method.run(opts)
    .then(res => assert.deepEqual(res, [[serverCfg.userName, serverCfg.password]]));
  });


  test('with single invalid credential', assert => {
    assert.plan(1);

    opts.passwords = ['ola'];

    method.run(opts)
    .then(res => assert.deepEqual(res, []));
  });


  test('with multiple valid and invalid credentials', assert => {
    assert.plan(1);

    opts.passwords = ['ola', 'bar'];

    method.run(opts)
    .then(res => assert.deepEqual(res, [[serverCfg.userName, serverCfg.password]]));
  });


  test('with an invalid port', assert => {
    assert.plan(1);

    opts.port = 6666;

    const expectedErr = `connect ECONNREFUSED ${opts.target}:${opts.port}`;

    method.run(opts)
    .then(() => assert.fail('Should fail.'))
    .catch(err => {
      server.stop();

      assert.equal(err.message, expectedErr);
    });
  });
});


// Starting an SSH server with different setup.
// We can do it in parallel.

const serverCfg2 = utils.cloneDeep(serverCfg);
serverCfg2.port = 1338;
serverCfg2.password = 'foo';

const server2 = new Server(serverCfg2);
server2.start()
.then(() => {
  test('with non valid credentials but "userAsPass" is valid', assert => {
    assert.plan(1);

    // Any non valid is ok here.
    opts.port = serverCfg2.port;
    opts.passwords = ['ola'];
    opts.userAsPass = true;

    method.run(opts)
    .then(res => {
      server2.stop();

      assert.deepEqual(res, [[serverCfg2.userName, serverCfg2.password]]);
    });
  });
});