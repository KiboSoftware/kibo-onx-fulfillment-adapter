/**
 * Test Fixtures: Kibo Customers
 *
 * Sample Kibo customer payloads for unit testing.
 */

import type { KiboCustomerAccount } from '../../src/types.js';

/**
 * Sample Kibo customer account.
 */
export const sampleKiboCustomer: KiboCustomerAccount = {
  id: 5001,
  emailAddress: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  companyOrOrganization: 'Acme Corp',
  isActive: true,
  isAnonymous: false,
  accountType: 'Registered',
  contacts: [
    {
      id: 1001,
      types: [
        { name: 'Billing', isPrimary: true },
        { name: 'Shipping', isPrimary: true },
      ],
      email: 'john.doe@example.com',
      firstName: 'John',
      lastNameOrSurname: 'Doe',
      phoneNumbers: {
        home: '555-123-4567',
        mobile: '555-987-6543',
      },
      address: {
        address1: '123 Main Street',
        address2: 'Suite 100',
        cityOrTown: 'Austin',
        stateOrProvince: 'TX',
        postalOrZipCode: '78701',
        countryCode: 'US',
      },
    },
  ],
  auditInfo: {
    createDate: '2025-01-15T10:00:00Z',
    updateDate: '2026-02-01T14:30:00Z',
  },
};

/**
 * Sample Kibo customer - Business account.
 */
export const sampleKiboCustomerBusiness: KiboCustomerAccount = {
  id: 5002,
  emailAddress: 'purchasing@bigcorp.com',
  firstName: 'Jane',
  lastName: 'Smith',
  companyOrOrganization: 'Big Corporation Inc.',
  isActive: true,
  isAnonymous: false,
  accountType: 'B2B',
  contacts: [
    {
      id: 1002,
      types: [{ name: 'Billing', isPrimary: true }],
      email: 'billing@bigcorp.com',
      firstName: 'Jane',
      lastNameOrSurname: 'Smith',
      phoneNumbers: {
        work: '555-555-5555',
      },
      address: {
        address1: '500 Corporate Drive',
        cityOrTown: 'San Francisco',
        stateOrProvince: 'CA',
        postalOrZipCode: '94105',
        countryCode: 'US',
      },
    },
    {
      id: 1003,
      types: [{ name: 'Shipping', isPrimary: true }],
      email: 'warehouse@bigcorp.com',
      firstName: 'Warehouse',
      lastNameOrSurname: 'Team',
      phoneNumbers: {
        work: '555-555-5556',
      },
      address: {
        address1: '100 Warehouse Lane',
        cityOrTown: 'Oakland',
        stateOrProvince: 'CA',
        postalOrZipCode: '94607',
        countryCode: 'US',
      },
    },
  ],
  auditInfo: {
    createDate: '2024-06-01T08:00:00Z',
    updateDate: '2026-02-03T16:00:00Z',
  },
};

/**
 * Sample Kibo customer - Anonymous/Guest.
 */
export const sampleKiboCustomerAnonymous: KiboCustomerAccount = {
  id: 5003,
  emailAddress: 'guest@example.com',
  firstName: 'Guest',
  lastName: 'User',
  isActive: true,
  isAnonymous: true,
  accountType: 'Guest',
  contacts: [],
  auditInfo: {
    createDate: '2026-02-04T09:00:00Z',
    updateDate: '2026-02-04T09:00:00Z',
  },
};

/**
 * Sample Kibo customer - Inactive.
 */
export const sampleKiboCustomerInactive: KiboCustomerAccount = {
  ...sampleKiboCustomer,
  id: 5004,
  emailAddress: 'inactive@example.com',
  isActive: false,
};

/**
 * Sample Kibo customer collection (paginated response).
 */
export const sampleKiboCustomerCollection = {
  items: [sampleKiboCustomer, sampleKiboCustomerBusiness],
  totalCount: 2,
  pageCount: 1,
  pageSize: 50,
  startIndex: 0,
};

/**
 * Empty Kibo customer collection.
 */
export const emptyKiboCustomerCollection = {
  items: [],
  totalCount: 0,
  pageCount: 0,
  pageSize: 50,
  startIndex: 0,
};

/**
 * Creates a Kibo customer account with custom overrides.
 */
export function createKiboCustomer(
  overrides: Partial<KiboCustomerAccount> = {},
): KiboCustomerAccount {
  return {
    ...sampleKiboCustomer,
    id: Math.floor(Math.random() * 100000),
    emailAddress: `customer-${Date.now()}@example.com`,
    ...overrides,
  };
}
