/**
 * Address Transformer
 *
 * Maps between Kibo address/contact structures and COF Address.
 */

import type { KiboContact } from '../../types.js';

/**
 * COF Address structure (subset of Order schema).
 */
export interface COFAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  stateOrProvince?: string;
  zipCodeOrPostalCode?: string;
  country?: string;
}

/**
 * Maps a Kibo contact to a COF address.
 *
 * @param contact - Kibo contact structure
 * @returns COF address structure
 */
export function mapKiboContactToAddress(contact: KiboContact | undefined): COFAddress | undefined {
  if (!contact) {
    return undefined;
  }

  const phone = contact.phoneNumbers?.mobile ?? contact.phoneNumbers?.home ?? contact.phoneNumbers?.work;

  return {
    firstName: contact.firstName,
    lastName: contact.lastNameOrSurname,
    company: contact.companyOrOrganization,
    email: contact.email,
    phone,
    address1: contact.address?.address1,
    address2: contact.address?.address2,
    city: contact.address?.cityOrTown,
    stateOrProvince: contact.address?.stateOrProvince,
    zipCodeOrPostalCode: contact.address?.postalOrZipCode,
    country: contact.address?.countryCode,
  };
}

/**
 * Maps a COF address to a Kibo contact structure.
 *
 * @param address - COF address structure
 * @param email - Optional email override
 * @returns Kibo contact structure
 */
export function mapAddressToKiboContact(
  address: COFAddress | undefined,
  email?: string,
): KiboContact | undefined {
  if (!address) {
    return undefined;
  }

  return {
    email: email ?? address.email,
    firstName: address.firstName,
    lastNameOrSurname: address.lastName,
    companyOrOrganization: address.company,
    phoneNumbers: address.phone
      ? {
          home: address.phone,
        }
      : undefined,
    address: {
      address1: address.address1,
      address2: address.address2,
      cityOrTown: address.city,
      stateOrProvince: address.stateOrProvince,
      postalOrZipCode: address.zipCodeOrPostalCode,
      countryCode: address.country,
    },
  };
}
