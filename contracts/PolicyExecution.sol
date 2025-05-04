// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITenantManagement {
    function getTenantInfo(address _tenant) external view returns (
        string memory tenantId,
        string memory role,
        string memory tenantType,
        string memory type1Detail
    );

    function isTenant(address _tenant) external view returns (bool);
}

interface IAuditLogging {
    function logEvent(
        address user,
        uint256 timestamp,
        string memory eventType,
        uint256 policyId
    ) external;
}

contract PolicyExecution {
    address public owner;
    ITenantManagement public tenantManagement;
    IAuditLogging public auditLogging;

    struct Policy {
        uint256 policyId;
        string policyName;
        string policyContent;
        string tenantId;
        address creator;
        bool executed;
    }

    mapping(uint256 => Policy) public policies;
    uint256 public nextPolicyId;

    event DebugString(string label, string value);
    event DebugUint(string label, uint256 value);

    constructor(address _tenantManagementAddress, address _auditLoggingAddress) {
        owner = msg.sender;
        tenantManagement = ITenantManagement(_tenantManagementAddress);
        auditLogging = IAuditLogging(_auditLoggingAddress);
    }

    function createPolicy(
        string memory _policyName,
        string memory _policyContent,
        string memory _tenantId
    ) public {
        require(tenantManagement.isTenant(msg.sender), "Not a registered tenant");

        (, , string memory tenantType, ) = tenantManagement.getTenantInfo(msg.sender);
        require(compareStrings(tenantType, "type2"), "Only Cloud Admin (type2) can create policy");

        policies[nextPolicyId] = Policy({
            policyId: nextPolicyId,
            policyName: _policyName,
            policyContent: _policyContent,
            tenantId: _tenantId,
            creator: msg.sender,
            executed: false
        });
        nextPolicyId++;
    }

    function executePolicy(uint256 _policyId) public {
        require(tenantManagement.isTenant(msg.sender), string(abi.encodePacked("Not a registered tenant: ", toAsciiString(msg.sender))));

        (string memory tenantId, string memory role, string memory tenantType, string memory type1Detail) = tenantManagement.getTenantInfo(msg.sender);
        emit DebugString("tenantType", tenantType);
        require(compareStrings(tenantType, "type2"), string(abi.encodePacked("Only Cloud Admin (type2) can execute policy, got: ", tenantType)));

        require(_policyId < nextPolicyId, string(abi.encodePacked("Policy does not exist: ", uint2str(_policyId))));
        Policy storage policy = policies[_policyId];
        require(!policy.executed, "Policy already executed");

        policy.executed = true;
        // auditLogging.logEvent(
        //     msg.sender,
        //     block.timestamp,
        //     "PolicyExecuted",
        //     _policyId
        // );
    }

    // 工具函数
    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        str = string(bstr);
    }
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42);
        s[0] = '0';
        s[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            uint8 hi = uint8(b) / 16;
            uint8 lo = uint8(b) - 16 * hi;
            s[2*i + 2] = char(hi);
            s[2*i + 3] = char(lo);
        }
        return string(s);
    }
    function char(uint8 b) internal pure returns (bytes1 c) {
        if (b < 10) return bytes1(b + 0x30);
        else return bytes1(b + 0x57);
    }
}
