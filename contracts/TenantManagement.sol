/*pragma solidity ^0.8.20;

contract TenantManagement {
    struct Tenant {
        address tenantAddress;
        string companyName;
        bool exists;
    }

    mapping(address => Tenant) public tenants;

    event TenantRegistered(address indexed tenantAddress, string companyName);

    function registerTenant(string memory _companyName) public {
        require(!tenants[msg.sender].exists, "Tenant already registered");
        tenants[msg.sender] = Tenant(msg.sender, _companyName, true);
        emit TenantRegistered(msg.sender, _companyName);
    }

    function isTenant(address _tenant) public view returns (bool) {
        return tenants[_tenant].exists;
    }
}
*/


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TenantManagement {
    struct Tenant {
        address tenantAddress;
        string tenantId;   // tenant name or ID
        string role;       // user role, like "admin", "user"
        bool exists;
    }

    mapping(address => Tenant) public tenants;

    event TenantRegistered(address indexed tenantAddress, string tenantId, string role);

    // ✅ 注册租户并指定角色
    function registerTenant(string memory _tenantId, string memory _role) public {
        require(!tenants[msg.sender].exists, "Tenant already registered");
        tenants[msg.sender] = Tenant(msg.sender, _tenantId, _role, true);
        emit TenantRegistered(msg.sender, _tenantId, _role);
    }

    // ✅ 检查租户是否存在
    function isTenant(address _tenant) public view returns (bool) {
        return tenants[_tenant].exists;
    }

    // ✅ 返回调用者的 tenantId
    function getTenantId(address _user) public view returns (string memory) {
        require(tenants[_user].exists, "Not registered");
        return tenants[_user].tenantId;
    }

    // ✅ 返回调用者的 role
    function getRole(address _user) public view returns (string memory) {
        require(tenants[_user].exists, "Not registered");
        return tenants[_user].role;
    }
}
