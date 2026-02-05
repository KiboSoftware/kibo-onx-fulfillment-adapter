/**
 * Customer Transformers (User Story 6)
 *
 * Maps between Kibo CustomerAccount types and COF Customer types.
 */

import type { Customer } from '@cof-org/mcp';
import type { CustomerAccount, CustomerContact } from '@kibocommerce/rest-sdk/clients/Customer';

/**
 * Maps Kibo CustomerContact addresses to COF Address format
 */
function mapKiboContactsToAddresses(
  contacts: CustomerContact[] | null | undefined,
): Array<{ name?: string; address: Record<string, string | undefined> }> | undefined {
  if (!contacts || contacts.length === 0) {
    return undefined;
  }

  return contacts
    .filter((contact) => contact.address)
    .map((contact) => ({
      name: contact.types?.find((t) => t.isPrimary)?.name ?? 'Address',
      address: {
        address1: contact.address?.address1 ?? undefined,
        address2: contact.address?.address2 ?? undefined,
        city: contact.address?.cityOrTown ?? undefined,
        stateOrProvince: contact.address?.stateOrProvince ?? undefined,
        zipCodeOrPostalCode: contact.address?.postalOrZipCode ?? undefined,
        country: contact.address?.countryCode ?? undefined,
        firstName: contact.firstName ?? undefined,
        lastName: contact.lastNameOrSurname ?? undefined,
        email: contact.email ?? undefined,
        phone: contact.phoneNumbers?.mobile ?? contact.phoneNumbers?.home ?? undefined,
        company: contact.companyOrOrganization ?? undefined,
      },
    }));
}

/**
 * Maps Kibo CustomerAttribute array to COF customFields format
 */
function mapKiboAttributesToCustomFields(
  attributes: Array<{ fullyQualifiedName?: string | null; values?: string[] | null }> | null | undefined,
): Array<{ name: string; value: string }> | undefined {
  if (!attributes || attributes.length === 0) {
    return undefined;
  }

  return attributes
    .filter((attr) => attr.fullyQualifiedName && attr.values && attr.values.length > 0)
    .map((attr) => ({
      name: attr.fullyQualifiedName!,
      value: attr.values![0]!,
    }));
}

/**
 * Maps a Kibo CustomerAccount to COF Customer.
 *
 * @param kiboCustomer - Kibo CustomerAccount object
 * @param tenantId - Tenant ID for COF entity
 * @returns COF Customer object
 */
export function mapKiboCustomerToCOF(
  kiboCustomer: CustomerAccount,
  tenantId: string,
): Customer {
  const customerId = kiboCustomer.id?.toString() ?? '';
  const now = new Date().toISOString();

  return {
    id: customerId,
    tenantId,
    externalId: kiboCustomer.externalId ?? customerId,
    email: kiboCustomer.emailAddress ?? undefined,
    firstName: kiboCustomer.firstName ?? undefined,
    lastName: kiboCustomer.lastName ?? undefined,
    phone: kiboCustomer.contacts?.[0]?.phoneNumbers?.mobile ??
           kiboCustomer.contacts?.[0]?.phoneNumbers?.home ?? undefined,
    status: kiboCustomer.isActive ? 'active' : 'inactive',
    type: kiboCustomer.isAnonymous ? 'guest' : 'registered',
    notes: kiboCustomer.notes?.map((n) => n.content).join('; ') ?? undefined,
    addresses: mapKiboContactsToAddresses(kiboCustomer.contacts),
    customFields: mapKiboAttributesToCustomFields(kiboCustomer.attributes),
    tags: kiboCustomer.segments?.map((s) => s.name ?? s.code ?? '')?.filter(Boolean) ?? undefined,
    createdAt: kiboCustomer.auditInfo?.createDate ?? now,
    updatedAt: kiboCustomer.auditInfo?.updateDate ?? now,
  };
}

/**
 * Maps an array of Kibo CustomerAccount to COF Customer array.
 *
 * @param kiboCustomers - Array of Kibo CustomerAccount objects
 * @param tenantId - Tenant ID for COF entities
 * @returns Array of COF Customer objects
 */
export function mapKiboCustomerListToCOF(
  kiboCustomers: CustomerAccount[],
  tenantId: string,
): Customer[] {
  return kiboCustomers
    .filter((customer) => customer.id != null)
    .map((customer) => mapKiboCustomerToCOF(customer, tenantId));
}
