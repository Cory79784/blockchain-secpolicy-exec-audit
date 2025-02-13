// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditLogging {
    struct LogEntry {
        address tenant;
        uint policyId;
        string action;
        uint timestamp;
    }

    LogEntry[] public logs;

    event LogRecorded(address indexed tenant, uint policyId, string action, uint timestamp);

    function recordLog(address _tenant, uint _policyId, string memory _action) public {
        logs.push(LogEntry(_tenant, _policyId, _action, block.timestamp));
        emit LogRecorded(_tenant, _policyId, _action, block.timestamp);
    }

    function getLogs() public view returns (LogEntry[] memory) {
        return logs;
    }
}
