// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditLogging {
    struct LogEntry {
        address executor;
        uint policyId;
        uint256 timestamp;
        bool success;
        string tenantId;
        string role;
    }

    LogEntry[] public logs;

    mapping(address => string) public userTenant;
    mapping(address => string) public userRole;

    event LogRecorded(
        address indexed executor,
        uint policyId,
        bool success,
        uint256 timestamp,
        string tenantId,
        string role
    );

    function registerUserContext(address user, string memory tenantId, string memory role) public {
        userTenant[user] = tenantId;
        userRole[user] = role;
    }

    function recordLog(
        address _executor,
        uint _policyId,
        bool _success,
        string memory _tenantId,
        string memory _role
    ) public {
        logs.push(LogEntry({
            executor: _executor,
            policyId: _policyId,
            timestamp: block.timestamp,
            success: _success,
            tenantId: _tenantId,
            role: _role
        }));

        userTenant[_executor] = _tenantId;
        userRole[_executor] = _role;

        emit LogRecorded(_executor, _policyId, _success, block.timestamp, _tenantId, _role);
    }

    function getLogCount() public view returns (uint) {
        return logs.length;
    }

    function getLog(uint index) public view returns (LogEntry memory) {
        require(index < logs.length, "Invalid log index");

        LogEntry memory entry = logs[index];

        string memory callerTenant = userTenant[msg.sender];
        string memory callerRole = userRole[msg.sender];

        require(
            keccak256(bytes(entry.tenantId)) == keccak256(bytes(callerTenant)) &&
            (
                keccak256(abi.encodePacked(entry.executor)) == keccak256(abi.encodePacked(msg.sender)) ||
                keccak256(bytes(callerRole)) == keccak256("admin")
            ),
            "Access denied: Not authorized to view this log"
        );

        return entry;
    }
}
