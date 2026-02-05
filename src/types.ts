/**
 * Kibo Commerce Type Definitions
 *
 * Types for mapping between Kibo Commerce API responses and COF types.
 * These types are derived from @kibocommerce/rest-sdk but defined here
 * for explicit control over the mapping layer.
 */

// ============================================================================
// Kibo Order Status Mapping
// ============================================================================

/**
 * Kibo order status values as returned by the Commerce API.
 */
export type KiboOrderStatus =
  | 'Pending'
  | 'Submitted'
  | 'Processing'
  | 'PendingReview'
  | 'Accepted'
  | 'Completed'
  | 'Cancelled'
  | 'Errored';

/**
 * COF order status values.
 */
export type COFOrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'FULFILLED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ERROR';

/**
 * Maps Kibo order status to COF order status.
 */
export const KIBO_ORDER_STATUS_MAP: Record<KiboOrderStatus, COFOrderStatus> = {
  Pending: 'PENDING',
  Submitted: 'PROCESSING',
  Processing: 'PROCESSING',
  PendingReview: 'PROCESSING',
  Accepted: 'PROCESSING',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
  Errored: 'ERROR',
};

// ============================================================================
// Kibo Shipment Status Mapping
// ============================================================================

/**
 * Kibo shipment status values.
 */
export type KiboShipmentStatus =
  | 'Ready'
  | 'Reassigned'
  | 'Backorder'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

/**
 * COF fulfillment status values.
 */
export type COFFulfillmentStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

/**
 * Maps Kibo shipment status to COF fulfillment status.
 */
export const KIBO_SHIPMENT_STATUS_MAP: Record<KiboShipmentStatus, COFFulfillmentStatus> = {
  Ready: 'PENDING',
  Reassigned: 'PENDING',
  Backorder: 'PENDING',
  Shipped: 'SHIPPED',
  Delivered: 'DELIVERED',
  Cancelled: 'CANCELLED',
};

// ============================================================================
// Kibo Return Status Mapping
// ============================================================================

/**
 * Kibo return status values.
 */
export type KiboReturnStatus =
  | 'Created'
  | 'Received'
  | 'Processed'
  | 'Refunded'
  | 'Cancelled'
  | 'Closed';

/**
 * COF return status values.
 */
export type COFReturnStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Maps Kibo return status to COF return status.
 */
export const KIBO_RETURN_STATUS_MAP: Record<KiboReturnStatus, COFReturnStatus> = {
  Created: 'PENDING',
  Received: 'RECEIVED',
  Processed: 'PROCESSING',
  Refunded: 'COMPLETED',
  Cancelled: 'CANCELLED',
  Closed: 'COMPLETED',
};

// ============================================================================
// Kibo API Response Types (subset of SDK types for mapping)
// ============================================================================

/**
 * Kibo address/contact structure.
 */
export interface KiboContact {
  id?: number;
  email?: string;
  firstName?: string;
  lastNameOrSurname?: string;
  companyOrOrganization?: string;
  phoneNumbers?: {
    home?: string;
    mobile?: string;
    work?: string;
  };
  address?: {
    address1?: string;
    address2?: string;
    address3?: string;
    address4?: string;
    cityOrTown?: string;
    stateOrProvince?: string;
    postalOrZipCode?: string;
    countryCode?: string;
    addressType?: string;
    isValidated?: boolean;
  };
}

/**
 * Kibo order item structure.
 */
export interface KiboOrderItem {
  id?: string;
  lineId?: number;
  product?: {
    productCode?: string;
    name?: string;
    description?: string;
    imageUrl?: string;
    variationProductCode?: string;
    options?: Array<{
      attributeFQN?: string;
      name?: string;
      value?: unknown;
    }>;
    properties?: Array<{
      attributeFQN?: string;
      name?: string;
      values?: Array<{ value?: unknown }>;
    }>;
    price?: {
      price?: number;
      salePrice?: number;
      tenantOverridePrice?: number;
    };
  };
  quantity?: number;
  subtotal?: number;
  extendedTotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  fulfillmentLocationCode?: string;
  fulfillmentMethod?: string;
}

/**
 * Kibo order structure (simplified for mapping).
 */
export interface KiboOrder {
  id?: string;
  orderNumber?: number;
  externalId?: string;
  status?: string;
  submittedDate?: string;
  acceptedDate?: string;
  closedDate?: string;
  cancelledDate?: string;
  email?: string;
  customerAccountId?: number;
  billingInfo?: {
    billingContact?: KiboContact;
    paymentType?: string;
  };
  fulfillmentInfo?: {
    fulfillmentContact?: KiboContact;
    shippingMethodCode?: string;
    shippingMethodName?: string;
  };
  items?: KiboOrderItem[];
  subtotal?: number;
  shippingSubTotal?: number;
  shippingTotal?: number;
  handlingSubTotal?: number;
  handlingTotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  total?: number;
  currencyCode?: string;
  notes?: Array<{
    id?: string;
    text?: string;
    auditInfo?: {
      createDate?: string;
      createBy?: string;
    };
  }>;
  attributes?: Array<{
    fullyQualifiedName?: string;
    values?: unknown[];
  }>;
  auditInfo?: {
    createDate?: string;
    createBy?: string;
    updateDate?: string;
    updateBy?: string;
  };
}

/**
 * Kibo shipment structure (simplified for mapping).
 */
export interface KiboShipment {
  id?: string;
  shipmentNumber?: number;
  orderId?: string;
  orderNumber?: number;
  shipmentStatus?: string;
  shipmentStatusReason?: string;
  fulfillmentLocationCode?: string;
  shipmentType?: string;
  packages?: Array<{
    packageId?: string;
    trackingNumber?: string;
    carrier?: string;
    shippingMethodCode?: string;
    shippingMethodName?: string;
  }>;
  items?: Array<{
    lineId?: number;
    productCode?: string;
    quantity?: number;
  }>;
  destinationContact?: KiboContact;
  auditInfo?: {
    createDate?: string;
    updateDate?: string;
  };
}

/**
 * Kibo inventory item structure.
 */
export interface KiboInventoryItem {
  productCode?: string;
  locationCode?: string;
  available?: number;
  allocated?: number;
  onHand?: number;
  pending?: number;
}

/**
 * Kibo product structure (simplified for mapping).
 */
export interface KiboProduct {
  productCode?: string;
  productSequence?: number;
  productName?: string;
  productType?: string;
  productTypeId?: number;
  isVariation?: boolean;
  masterProductCode?: string;
  productUsage?: string;
  content?: {
    productName?: string;
    productShortDescription?: string;
    productFullDescription?: string;
  };
  price?: {
    price?: number;
    salePrice?: number;
    isoCurrencyCode?: string;
  };
  isActive?: boolean;
  isRecurring?: boolean;
  isTaxable?: boolean;
  inventoryInfo?: {
    manageStock?: boolean;
    onlineEnabled?: boolean;
    onlineSoftStockAvailable?: number;
  };
  variations?: KiboProductVariation[];
  auditInfo?: {
    createDate?: string;
    updateDate?: string;
  };
}

/**
 * Kibo product variation structure.
 */
export interface KiboProductVariation {
  productCode?: string;
  variationProductCode?: string;
  isActive?: boolean;
  price?: {
    price?: number;
    salePrice?: number;
  };
  options?: Array<{
    attributeFQN?: string;
    value?: unknown;
  }>;
  inventoryInfo?: {
    onlineEnabled?: boolean;
    onlineSoftStockAvailable?: number;
  };
}

/**
 * Kibo customer account structure.
 */
export interface KiboCustomerAccount {
  id?: number;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
  companyOrOrganization?: string;
  isActive?: boolean;
  isAnonymous?: boolean;
  accountType?: string;
  contacts?: Array<{
    id?: number;
    types?: Array<{ name?: string; isPrimary?: boolean }>;
    email?: string;
    firstName?: string;
    lastNameOrSurname?: string;
    phoneNumbers?: {
      home?: string;
      mobile?: string;
      work?: string;
    };
    address?: {
      address1?: string;
      address2?: string;
      cityOrTown?: string;
      stateOrProvince?: string;
      postalOrZipCode?: string;
      countryCode?: string;
    };
  }>;
  auditInfo?: {
    createDate?: string;
    updateDate?: string;
  };
}

/**
 * Kibo return structure.
 */
export interface KiboReturn {
  id?: string;
  returnNumber?: number;
  originalOrderId?: string;
  originalOrderNumber?: number;
  status?: string;
  returnType?: string;
  items?: Array<{
    id?: string;
    productCode?: string;
    quantity?: number;
    returnReason?: string;
  }>;
  refundAmount?: number;
  auditInfo?: {
    createDate?: string;
    updateDate?: string;
  };
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Kibo paginated collection response.
 */
export interface KiboPaginatedCollection<T> {
  items?: T[];
  totalCount?: number;
  pageCount?: number;
  pageSize?: number;
  startIndex?: number;
}

/**
 * Pagination options for list operations.
 */
export interface PaginationOptions {
  pageSize?: number;
  startIndex?: number;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filter options for order queries.
 */
export interface KiboOrderFilter {
  status?: string;
  customerId?: string | number;
  fromDate?: Date | string;
  toDate?: Date | string;
  email?: string;
  externalId?: string;
}

/**
 * Filter options for product queries.
 */
export interface KiboProductFilter {
  productCodes?: string[];
  isActive?: boolean;
  productType?: string;
}

/**
 * Filter options for customer queries.
 */
export interface KiboCustomerFilter {
  email?: string;
  customerId?: string | number;
  firstName?: string;
  lastName?: string;
}

/**
 * Filter options for inventory queries.
 */
export interface KiboInventoryFilter {
  productCodes?: string[];
  locationCodes?: string[];
}
