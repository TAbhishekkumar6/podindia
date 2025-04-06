import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, FileText, X, CheckCircle, Plus, Minus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, uploadFiles, generateOrderId } from '../lib/supabase';
import { logError } from '../lib/error-logging';
import WhatsAppSupport from './WhatsAppSupport';

const MAX_FILES = 25;
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes
const PHONE_REGEX = /^[0-9]{10}$/;

const inputClasses = "w-full h-12 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm";
const textareaClasses = "w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm min-h-[120px]";
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
const errorClasses = "text-red-500 text-sm mt-1";

const PRODUCTS = [
  'Oversized 240GSM T-shirt 100% Cotton, French Terry',
  'Oversized 180GSM T-shirt',
  'Regular T-shirt 180GSM',
  'Hoodie 320GSM',
  'Hoodie 430GSM',
  'Sweatshirt 320GSM',
  'Acid Wash T-shirt 240GSM',
  'Acid Wash Vest 240GSM'
];

const ACID_WASH_PRODUCTS = [
  'Acid Wash T-shirt 240GSM',
  'Acid Wash Vest 240GSM'
];

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const ACID_WASH_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
const COLORS = ['black', 'white', 'custom'];
const PAYMENT_OPTIONS = ['Paid Full', 'Paid Half'];
const ORDER_MODES = ['Prepaid', 'COD'];

const PRINT_SIZES_FRONT = [
  'A2 - 16x20 inch',
  'A3 - 14x16 inch',
  'A4 - 10x12 inch',
  'Front Chest',
  'Front Centre',
  'Follow Mockup',
  'Plain Front No Print'
];

const PRINT_SIZES_BACK = [
  'A2 - 16x20 inch',
  'A3 - 14x16 inch',
  'A4 - 10x12 inch',
  'Back Chest',
  'Back Centre',
  'Follow Mockup',
  'Plain Back No Print'
];

const NECK_LABEL_OPTIONS = ['Yes', 'No'];
const SLEEVES_OPTIONS = ['Yes', 'No'];

interface ProductItem {
  product: string;
  size: string;
  color: string;
  customColor?: string;
  quantity: number;
  frontPrintSize: string;
  backPrintSize: string;
  neckLabel: string;
  sleeves: string;
}

interface FileUploadSection {
  title: string;
  description: string;
  files: File[];
  links: string[];
  useLinks: boolean;
  onFileChange: (files: File[]) => void;
  onLinkChange: (links: string[]) => void;
  onToggleMode: () => void;
  maxFiles?: number;
}

interface SuccessScreenProps {
  orderId: string;
  onTrack: () => void;
  onSubmitAnother: () => void;
}

interface FormData {
  name: string;
  brandName: string;
  address: string;
  phone: string;
  whatsapp: string;
  paymentInfo: string;
  paymentScreenshot: FileList;
  pincode: string;
  orderMode: string;
  codAmount?: string;
}

function SuccessScreen({ orderId, onTrack, onSubmitAnother }: SuccessScreenProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-lg w-full mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Order Submitted Successfully!</h2>
        <p className="text-lg text-gray-600 mb-3">Congratulations! Your order has been received.</p>
        <p className="text-md text-gray-500 mb-8 font-mono">{orderId}</p>
        <div className="space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onTrack}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Track Order
          </button>
          <button
            onClick={onSubmitAnother}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Submit Another Order
          </button>
        </div>
      </div>
    </div>
  );
}

function FileUploadSection({ 
  title, 
  description, 
  files, 
  links,
  useLinks,
  onFileChange,
  onLinkChange,
  onToggleMode,
  maxFiles = MAX_FILES
}: FileUploadSection) {
  const [newLink, setNewLink] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }  
  };

  const handleFileChange = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    const totalFiles = files.length + fileArray.length;

    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const oversizedFiles = fileArray.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError('Some files exceed the 30MB size limit');
      return;
    }

    setError(null);
    onFileChange([...files, ...fileArray]);
  };

  const handleLinkAdd = () => {
    if (!newLink.trim()) return;

    if (!isValidUrl(newLink)) {
      setError('Please enter a valid URL');
      return;
    }

    if (links.length >= maxFiles) {
      setError(`Maximum ${maxFiles} links allowed`);
      return;
    }

    setError(null);
    onLinkChange([...links, newLink.trim()]);
    setNewLink('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <label className={labelClasses}>{title}</label>
          <span className="text-sm text-gray-500 ml-2">
            ({useLinks ? links.length : files.length}/{maxFiles})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {useLinks ? 'Switch to File Upload' : 'Switch to Link Upload'}
          </span>
          <button
            type="button"
            onClick={onToggleMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              useLinks ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useLinks ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {useLinks ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Enter file URL"
              className={inputClasses}
              disabled={links.length >= maxFiles}
            />
            <button
              type="button"
              onClick={handleLinkAdd}
              disabled={links.length >= maxFiles}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Link
            </button>
          </div>
          {links.length > 0 && (
            <ul className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
              {links.map((link, index) => (
                <li key={index} className="px-4 py-3 flex items-center justify-between">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 truncate"
                  >
                    {link}
                  </a>
                  <button
                    type="button"
                    onClick={() => onLinkChange(links.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors">
            <div className="space-y-2 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className={`relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 ${
                  files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  <span>Upload files</span>
                  <input
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={(e) => {
                      handleFileChange(e.target.files);
                      e.target.value = '';
                    }}
                    disabled={files.length >= maxFiles}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                {description}<br />
                Maximum {maxFiles} files, up to 30MB each
              </p>
            </div>
          </div>
          {files.length > 0 && (
            <ul className="mt-3 divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
              {files.map((file, index) => (
                <li key={index} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">{file.name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFileChange(files.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ProductForm({ 
  product, 
  onUpdate, 
  onRemove,
  index,
  isOnly 
}: { 
  product: ProductItem;
  onUpdate: (index: number, product: ProductItem) => void;
  onRemove: (index: number) => void;
  index: number;
  isOnly: boolean;
}) {
  const isAcidWash = ACID_WASH_PRODUCTS.includes(product.product);
  const availableSizes = isAcidWash ? ACID_WASH_SIZES : SIZES;
  const availableColors = isAcidWash ? ['black'] : COLORS;

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProduct = e.target.value;
    const updatedProduct = { ...product, product: newProduct };
    
    if (ACID_WASH_PRODUCTS.includes(newProduct)) {
      updatedProduct.color = 'black';
    } else if (product.color === 'black' && !ACID_WASH_PRODUCTS.includes(newProduct)) {
      updatedProduct.color = '';
    }
    
    onUpdate(index, updatedProduct);
  };

  return (
    <div className="bg-white rounded-lg p-6 space-y-6 relative">
      {!isOnly && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor={`product-${index}`} className={labelClasses}>
            Product
          </label>
          <select
            id={`product-${index}`}
            value={product.product}
            onChange={handleProductChange}
            className={`${inputClasses} ${!product.product ? 'border-red-500' : ''}`}
          >
            <option value="">Select a product</option>
            {PRODUCTS.map(prod => (
              <option key={prod} value={prod}>
                {prod}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`size-${index}`} className={labelClasses}>
            Size
          </label>
          <select
            id={`size-${index}`}
            value={product.size}
            onChange={(e) => onUpdate(index, { ...product, size: e.target.value })}
            className={`${inputClasses} ${!product.size ? 'border-red-500' : ''}`}
          >
            <option value="">Select a size</option>
            {availableSizes.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`frontPrintSize-${index}`} className={labelClasses}>
            Front Print Size
          </label>
          <select
            id={`frontPrintSize-${index}`}
            value={product.frontPrintSize}
            onChange={(e) => onUpdate(index, { ...product, frontPrintSize: e.target.value })}
            className={`${inputClasses} ${!product.frontPrintSize ? 'border-red-500' : ''}`}
          >
            <option value="">Select front print size</option>
            {PRINT_SIZES_FRONT.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`backPrintSize-${index}`} className={labelClasses}>
            Back Print Size
          </label>
          <select
            id={`backPrintSize-${index}`}
            value={product.backPrintSize}
            onChange={(e) => onUpdate(index, { ...product, backPrintSize: e.target.value })}
            className={`${inputClasses} ${!product.backPrintSize ? 'border-red-500' : ''}`}
          >
            <option value="">Select back print size</option>
            {PRINT_SIZES_BACK.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`neckLabel-${index}`} className={labelClasses}>
            Print Neck Label
          </label>
          <select
            id={`neckLabel-${index}`}
            value={product.neckLabel}
            onChange={(e) => onUpdate(index, { ...product, neckLabel: e.target.value })}
            className={`${inputClasses} ${!product.neckLabel ? 'border-red-500' : ''}`}
          >
            <option value="">Select neck label option</option>
            {NECK_LABEL_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`sleeves-${index}`} className={labelClasses}>
            Print Sleeves
          </label>
          <select
            id={`sleeves-${index}`}
            value={product.sleeves}
            onChange={(e) => onUpdate(index, { ...product, sleeves: e.target.value })}
            className={`${inputClasses} ${!product.sleeves ? 'border-red-500' : ''}`}
          >
            <option value="">Select print sleeves option</option>
            {SLEEVES_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`color-${index}`} className={labelClasses}>
            Color
          </label>
          <select
            id={`color-${index}`}
            value={product.color}
            onChange={(e) => onUpdate(index, { ...product, color: e.target.value })}
            className={`${inputClasses} ${!product.color ? 'border-red-500' : ''}`}
          >
            <option value="">Select a color</option>
            {availableColors.map(color => (
              <option key={color} value={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {product.color === 'custom' && (
          <div>
            <label htmlFor={`customColor-${index}`} className={labelClasses}>
              Custom Color
            </label>
            <input
              type="text"
              id={`customColor-${index}`}
              value={product.customColor || ''}
              onChange={(e) => onUpdate(index, { ...product, customColor: e.target.value })}
              className={`${inputClasses} ${!product.customColor ? 'border-red-500' : ''}`}
              placeholder="Specify your custom color"
              required
            />
            {!product.customColor && (
              <span className={errorClasses}>Custom color required</span>
            )}
          </div>
        )}

        <div>
          <label htmlFor={`quantity-${index}`} className={labelClasses}>
            Quantity
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdate(index, { 
                ...product, 
                quantity: Math.max(1, product.quantity - 1) 
              })}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              id={`quantity-${index}`}
              value={product.quantity}
              onChange={(e) => onUpdate(index, { 
                ...product, 
                quantity: Math.max(1, parseInt(e.target.value) || 1) 
              })}
              min="1"
              className={inputClasses}
            />
            <button
              type="button"
              onClick={() => onUpdate(index, { 
                ...product, 
                quantity: product.quantity + 1 
              })}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([getDefaultProduct()]);
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [designLinks, setDesignLinks] = useState<string[]>([]);
  const [useDesignLinks, setUseDesignLinks] = useState(false);
  const [mockupFiles, setMockupFiles] = useState<File[]>([]);
  const [mockupLinks, setMockupLinks] = useState<string[]>([]);
  const [useMockupLinks, setUseMockupLinks] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const orderMode = watch('orderMode');

  const addProduct = () => {
    setProducts([...products, {
      product: '',
      size: '',
      color: '',
      quantity: 1,
      frontPrintSize: '',
      backPrintSize: '',
      neckLabel: '',
      sleeves: ''
    }]);
  };

  const updateProduct = (index: number, updatedProduct: ProductItem) => {
    setProducts(products.map((p, i) => i === index ? updatedProduct : p));
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setSubmissionError(null);

      // Validate phone numbers
      if (!PHONE_REGEX.test(data.phone) || !PHONE_REGEX.test(data.whatsapp)) {
        setSubmissionError('Phone numbers must be 10 digits');
        return;
      }

      // Validate at least one product
      if (products.length === 0) {
        setSubmissionError('At least one product is required');
        return;
      }

      // Validate files or links
      if ((!designFiles.length && !designLinks.length) || (!mockupFiles.length && !mockupLinks.length)) {
        setSubmissionError('Both design and mockup files/links are required');
        return;
      }

      const orderId = await generateOrderId();
      
      // Upload files with progress tracking
      const [designUrls, mockupUrls, paymentScreenshotUrl] = await Promise.all([
        uploadFiles(designFiles, `orders/${orderId}/designs`),
        uploadFiles(mockupFiles, `orders/${orderId}/mockups`),
        uploadFiles(Array.from(data.paymentScreenshot), `orders/${orderId}/payment`)
      ]);

      const { error: orderError } = await supabase.from('orders').insert({
        order_id: orderId,
        name: data.name,
        brand_name: data.brandName,
        address: `${data.address}\nPincode: ${data.pincode}`,
        phone: data.phone,
        whatsapp: data.whatsapp,
        payment_info: data.paymentInfo,
        status: 'pending',
        design_urls: [...designUrls, ...designLinks],
        mockup_urls: [...mockupUrls, ...mockupLinks],
        payment_screenshot_urls: paymentScreenshotUrl,
        order_mode: data.orderMode,
        cod_amount: data.orderMode === 'COD' ? data.codAmount : null
      });

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = products.map(product => ({
        order_id: orderId,
        product: product.product,
        size: product.size,
        color: product.color === 'custom' ? product.customColor : product.color,
        quantity: product.quantity,
        front_print_size: product.frontPrintSize,
        back_print_size: product.backPrintSize,
        neck_label: product.neckLabel,
        sleeves: product.sleeves
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Navigate to success screen
      setSuccessOrderId(orderId);
      setShowSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedOrderId) {
    return (
      <SuccessScreen
        orderId={submittedOrderId}
        onTrack={() => navigate(`/track/${submittedOrderId}`)}
        onSubmitAnother={() => setSubmittedOrderId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="p-4 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">Submit Your Order</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-8 space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="name" className={labelClasses}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register('name', { required: true })}
                    className={inputClasses}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <span className={errorClasses}>This field is required</span>}
                </div>

                <div>
                  <label htmlFor="brandName" className={labelClasses}>
                    Brand Name
                  </label>
                  <input
                    type="text"
                    id="brandName"
                    {...register('brandName', { required: true })}
                    className={inputClasses}
                    placeholder="Enter your brand name"
                  />
                  {errors.brandName && <span className={errorClasses}>This field is required</span>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className={labelClasses}>
                    Shipping Address
                  </label>
                  <textarea
                    id="address"
                    {...register('address', { required: true })}
                    className={textareaClasses}
                    placeholder="Enter your complete shipping address"
                  />
                  {errors.address && <span className={errorClasses}>This field is required</span>}
                </div>

                <div>
                  <label htmlFor="pincode" className={labelClasses}>
                    Pincode
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    {...register('pincode', { required: true })}
                    className={inputClasses}
                    placeholder="Enter your pincode"
                  />
                  {errors.pincode && <span className={errorClasses}>This field is required</span>}
                </div>

                <div>
                  <label htmlFor="phone" className={labelClasses}>
                    Customer Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    {...register('phone', { required: true })}
                    className={inputClasses}
                    placeholder="Enter customer's phone number"
                  />
                  {errors.phone && <span className={errorClasses}>This field is required</span>}
                </div>

                <div>
                  <label htmlFor="whatsapp" className={labelClasses}>
                    Company/Order Creator WhatsApp Number
                   </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    {...register('whatsapp', { required: true })}
                    className={inputClasses}
                    placeholder="Enter company/order creator's WhatsApp number"
                  />
                  {errors.whatsapp && <span className={errorClasses}>This field is required</span>}
                </div>

                <div>
                  <label htmlFor="paymentInfo" className={labelClasses}>
                    Payment Info
                  </label>
                  <select
                    id="paymentInfo"
                    {...register('paymentInfo', { required: true })}
                    className={inputClasses}
                  >
                    <option value="">Select payment status</option>
                    {PAYMENT_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.paymentInfo && <span className={errorClasses}>This field is required</span>}
                </div>

                <div>
                  <label htmlFor="orderMode" className={labelClasses}>
                    Order Mode
                  </label>
                  <select
                    id="orderMode"
                    {...register('orderMode', { required: true })}
                    className={inputClasses}
                  >
                    <option value="">Select order mode</option>
                    {ORDER_MODES.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.orderMode && <span className={errorClasses}>This field is required</span>}
                </div>

                {orderMode === 'COD' && (
                  <div>
                    <label htmlFor="codAmount" className={labelClasses}>
                      COD Amount
                    </label>
                    <input
                      type="text"
                      id="codAmount"
                      {...register('codAmount')}
                      className={inputClasses}
                      placeholder="Enter COD amount"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 sm:p-8 space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Product Details</h2>
              
              <div className="space-y-6">
                {products.map((product, index) => (
                  <ProductForm
                    key={index}
                    product={product}
                    onUpdate={updateProduct}
                    onRemove={removeProduct}
                    index={index}
                    isOnly={products.length === 1}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={addProduct}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Another Product
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 sm:p-8 space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Design Files</h2>

              <FileUploadSection
                title="Design Files"
                description="Upload your design files (AI, PSD, PNG, etc.)"
                files={designFiles}
                links={designLinks}
                useLinks={useDesignLinks}
                onFileChange={setDesignFiles}
                onLinkChange={setDesignLinks}
                onToggleMode={() => setUseDesignLinks(!useDesignLinks)}
              />

              <FileUploadSection
                title="Mockup Files"
                description="Upload your mockup files"
                files={mockupFiles}
                links={mockupLinks}
                useLinks={useMockupLinks}
                onFileChange={setMockupFiles}
                onLinkChange={setMockupLinks}
                onToggleMode={() => setUseMockupLinks(!useMockupLinks)}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Upload className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Submitting...
                  </>
                ) : (
                  'Submit Order'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}