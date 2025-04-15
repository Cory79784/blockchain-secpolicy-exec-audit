
/*pragma solidity ^0.8.20;

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
        string tenantId;
        string role;
    }

    mapping(uint => Policy) public policies;
    uint private nextPolicyId;

    event PolicyCreated(uint policyId, string name, address owner);
    event PolicyExecuted(uint policyId, address executedBy, bool success);

    constructor(address _tenantManager, address _auditLogger) {
        tenantManager = TenantManagement(_tenantManager);
        auditLogger = AuditLogging(_auditLogger);
    }

    modifier onlyTenant() {
        require(tenantManager.isTenant(msg.sender), "Not a registered tenant");
        _;
    }

    function createPolicy(
        string memory _name,
        string memory _description,
        string memory _tenantId,
        string memory _role
    ) public onlyTenant {
        policies[nextPolicyId] = Policy(
            nextPolicyId,
            _name,
            _description,
            msg.sender,
            _tenantId,
            _role
        );
        emit PolicyCreated(nextPolicyId, _name, msg.sender);
        nextPolicyId++;
    }

    function executePolicy(uint _policyId) public {
        bool success = false;

        if (tenantManager.isTenant(msg.sender)) {
            if (policies[_policyId].owner == msg.sender) {
                success = true;
            }
        }

        Policy memory p = policies[_policyId];
        auditLogger.recordLog(msg.sender, _policyId, success, p.tenantId, p.role);
        emit PolicyExecuted(_policyId, msg.sender, success);
        
        require(success, "Unauthorized or not policy owner");
    }
}
*/



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
        string tenantId;
        string role;
    }

    mapping(uint => Policy) public policies;
    uint private nextPolicyId;

    event PolicyCreated(uint policyId, string name, address owner);
    event PolicyExecuted(uint policyId, address executedBy, bool success);

    constructor(address _tenantManager, address _auditLogger) {
        tenantManager = TenantManagement(_tenantManager);
        auditLogger = AuditLogging(_auditLogger);
    }

    modifier onlyTenant() {
        require(tenantManager.isTenant(msg.sender), "Not a registered tenant");
        _;
    }

    function createPolicy(
        string memory _name,
        string memory _description,
        string memory _tenantId,
        string memory _role
    ) public onlyTenant {
        policies[nextPolicyId] = Policy(
            nextPolicyId,
            _name,
            _description,
            msg.sender,
            _tenantId,
            _role
        );
        emit PolicyCreated(nextPolicyId, _name, msg.sender);
        nextPolicyId++;
    }

    function executePolicy(uint _policyId) public {
        bool success = false;

        if (tenantManager.isTenant(msg.sender)) {
            if (policies[_policyId].owner == msg.sender) {
                success = true;
            }
        }

        // ✅ 修复日志上下文：记录真实用户的 tenant 和 role
        string memory userTenantId = tenantManager.getTenantId(msg.sender);
        string memory userRole = tenantManager.getRole(msg.sender);

        auditLogger.recordLog(msg.sender, _policyId, success, userTenantId, userRole);
        emit PolicyExecuted(_policyId, msg.sender, success);

        require(success, "Unauthorized or not policy owner");
    }
}
