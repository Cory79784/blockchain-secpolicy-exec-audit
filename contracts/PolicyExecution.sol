// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TenantManagement.sol";
import "./AuditLogging.sol";

contract PolicyExecution {
    TenantManagement private tenantManager;
    AuditLogging private auditLogger;

    struct Policy {
        uint policyId;
        string name;
        string description;
        address owner;
    }

    mapping(uint => Policy) public policies;
    uint private nextPolicyId;

    event PolicyCreated(uint policyId, string name, address owner);
    event PolicyExecuted(uint policyId, address executedBy);

    constructor(address _tenantManager, address _auditLogger) {
        tenantManager = TenantManagement(_tenantManager);
        auditLogger = AuditLogging(_auditLogger);
    }

    modifier onlyTenant() {
        require(tenantManager.isTenant(msg.sender), "Not a registered tenant");
        _;
    }

    function createPolicy(string memory _name, string memory _description) public onlyTenant {
        policies[nextPolicyId] = Policy(nextPolicyId, _name, _description, msg.sender);
        emit PolicyCreated(nextPolicyId, _name, msg.sender);
        nextPolicyId++;
    }

    function executePolicy(uint _policyId) public onlyTenant {
        require(policies[_policyId].owner == msg.sender, "Not policy owner");

        // 触发审计日志
        auditLogger.recordLog(msg.sender, _policyId, "Executed Policy");

        emit PolicyExecuted(_policyId, msg.sender);
    }
}
