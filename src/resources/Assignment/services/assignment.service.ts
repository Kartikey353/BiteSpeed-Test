import prismaquery from "../../../Db/db";
import { StatusCodes } from "http-status-codes";
import CustomError from "@/utils/Error/coustomError";
import { logger } from "@/utils/logger/logger";
import { v4 as uuidv4 } from "uuid";
import { Contact, LinkPrecedence } from "@prisma/client";
import { response } from "express";
import { serializeBigInt } from "@/utils/serializer/Searlizer";

interface ContactResponse {
  contact: {
    primaryContactId: string;
    emails: string[];
    phoneNumbers: BigInt[];
    secondaryContactIds: string[];
  };
}

interface requestData {
  emailId?: string;
  phoneNumber?: number;
}
class assignmentService {
  public async inspect(Body: requestData): Promise<ContactResponse | null> {
    try {
      if (Body.emailId && Body.phoneNumber) {
        return await this.getResultforBoth(Body.emailId, Body.phoneNumber);
      } else if (Body.emailId) {
        return await this.getResultforParameter(Body.emailId, "emailId");
      } else if (Body.phoneNumber !== undefined) {
        return await this.getResultforParameter(
          Body.phoneNumber,
          "phoneNumber"
        );
      } else {
        throw new CustomError(
          "Both emailId,PhoneNumber can not be empty",
          StatusCodes.BAD_REQUEST
        );
      }
    } catch (e: any) {
      logger.error(e);
      throw new CustomError(e.message, e.status);
    }
  }
  public async createContact(
    emailId: string,
    phoneNumber: number,
    linkPrecedence: LinkPrecedence,
    linkedId: string
  ): Promise<Contact> {
    try {
      const createContactdata = await prismaquery.contact.create({
        data: {
          email: emailId,
          phoneNumber: phoneNumber,
          linkPrecedence: linkPrecedence,
          linkedId: linkedId,
        },
      });
      return createContactdata;
    } catch (e: any) {
      logger.error(e);
      throw new CustomError(e.message, e.status);
    }
  }

  public async getResultPrimaryforParameter(
    getPrimaryResultforPrarameter: Contact
  ): Promise<ContactResponse | null> {
    try {
      const id = getPrimaryResultforPrarameter.id;
      const getAllData = await prismaquery.contact.findMany({
        where: {
          linkedId: id,
        },
      });
      const emails: string[] = [];
      const phoneNumbers: BigInt[] = [];
      const secondaryContactIds: string[] = [];
      emails.push(getPrimaryResultforPrarameter.email);
      phoneNumbers.push(getPrimaryResultforPrarameter.phoneNumber);
      getAllData.forEach((contact) => {
        if (contact.email && !emails.includes(contact.email)) {
          emails.push(contact.email);
        }
        if (
          contact.phoneNumber &&
          !phoneNumbers.includes(contact.phoneNumber)
        ) {
          phoneNumbers.push(contact.phoneNumber);
        }
        if (contact.id !== getPrimaryResultforPrarameter.id) {
          secondaryContactIds.push(contact.id.toString());
        }
      });

      const response: ContactResponse = {
        contact: {
          primaryContactId: getPrimaryResultforPrarameter.id,
          emails: Array.from(new Set(emails)), // Ensure no duplicates
          phoneNumbers: Array.from(new Set(phoneNumbers)), // Ensure no duplicates
          secondaryContactIds: secondaryContactIds,
        },
      };
      return serializeBigInt(response);
    } catch (e: any) {
      logger.error(e);
      throw new CustomError(e.message, e.status);
    }
  }

  public async getResultSecondaryforParameter(
    primaryLinkedId: string
  ): Promise<ContactResponse | null> {
    try {
      const id = primaryLinkedId;
      const getAllData = await prismaquery.contact.findUniqueOrThrow({
        where: {
          id: primaryLinkedId,
        },
      });
      return await this.getResultPrimaryforParameter(getAllData);
    } catch (e: any) {
      logger.error(e);
      throw new CustomError(e.message, e.status);
    }
  }

  public async getResultforParameter(
    contactValue: string | number,
    contactType: "phoneNumber" | "emailId"
  ): Promise<ContactResponse | null> {
    try {
      const queryField =
        contactType === "phoneNumber" ? "phoneNumber" : "email";
      const getPrimaryResultforPhone = await prismaquery.contact.findFirst({
        where: {
          [queryField]: contactValue,
          linkPrecedence: LinkPrecedence.primary,
        },
      });

      if (getPrimaryResultforPhone) {
        return await this.getResultPrimaryforParameter(
          getPrimaryResultforPhone
        );
      } else {
        const getSecondaryResultforPhone =
          await prismaquery.contact.findFirstOrThrow({
            where: {
              [queryField]: contactValue,
              linkPrecedence: LinkPrecedence.secondary,
            },
          });
        if (getSecondaryResultforPhone.linkedId === null) {
          throw new CustomError(
            "Secondary contact's linkedId is unexpectedly null.",
            204
          );
        }
        return await this.getResultSecondaryforParameter(
          getSecondaryResultforPhone.linkedId
        );
      }
    } catch (e: any) {
      logger.error(e);
      throw new CustomError(
        `No details is present for ${contactType}`,
        e.status
      );
    }
  }

  public async checkIfPhoneNumberExist(phoneNumber: number): Promise<boolean> {
    try {
      const check = await prismaquery.contact.findMany({
        where: {
          phoneNumber: phoneNumber,
        },
      });
      if (check.length) return true;
      return false;
    } catch (e) {
      logger.error(e);
      throw new CustomError(`Something Went Wrong`, 500);
    }
  }

  public async checkIfEmailExist(email: string): Promise<boolean> {
    try {
      const check = await prismaquery.contact.findMany({
        where: {
          email: email,
        },
      });
      if (check.length) return true;
      return false;
    } catch (e) {
      logger.error(e);
      throw new CustomError(`Something Went Wrong`, 500);
    }
  }

  public async getResultforBoth(
    emailId: string,
    phoneNumber: number
  ): Promise<ContactResponse | null> {
    try {
      const getEmailResult = await this.checkIfEmailExist(emailId);
      const getPhoneNumber = await this.checkIfPhoneNumberExist(phoneNumber);
      if (getEmailResult && getPhoneNumber) {
        const checkIfEmailAndPhoneCommon = await prismaquery.contact.findFirst({
          where: {
            email: emailId,
            phoneNumber: phoneNumber,
          },
        });
        if (checkIfEmailAndPhoneCommon) {
          return await this.getResultforParameter(
            checkIfEmailAndPhoneCommon.email,
            "emailId"
          );
        } else {
          const getPhoneNumberdata = await prismaquery.contact.findMany({
            where: {
              phoneNumber: phoneNumber,
            },
          });
          const primarydata = await prismaquery.contact.findFirstOrThrow({
            where: {
              email: emailId,
            },
          });
          const id = primarydata?.id;
          getPhoneNumberdata.map(async (item, idx) => {
            if (item.email !== emailId) {
              await prismaquery.contact.update({
                where: {
                  id: item.id,
                },
                data: {
                  linkPrecedence: LinkPrecedence.secondary,
                  linkedId: id,
                },
              });
            } else {
              await prismaquery.contact.update({
                where: {
                  id: item.id,
                },
                data: {
                  linkPrecedence: LinkPrecedence.primary,
                  linkedId: null,
                },
              });
            }
          });
          return await this.getResultforParameter(primarydata.email, "emailId");
        }
      } else if (getEmailResult) {
        const getdata = await prismaquery.contact.findFirstOrThrow({
          where: {
            email: emailId,
            linkPrecedence: LinkPrecedence.primary,
          },
        });
        await this.createContact(
          emailId,
          phoneNumber,
          LinkPrecedence.secondary,
          getdata?.id
        );
        return await this.getResultforParameter(getdata.email, "emailId");
      } else if (getPhoneNumber) {
        const getdata = await prismaquery.contact.findFirstOrThrow({
          where: {
            phoneNumber: phoneNumber,
            linkPrecedence: LinkPrecedence.primary,
          },
        });
        await this.createContact(
          emailId,
          phoneNumber,
          LinkPrecedence.secondary,
          getdata?.id
        );
        return await this.getResultforParameter(getdata.email, "emailId");
      } else {
        const getdata = await this.createContact(
          emailId,
          phoneNumber,
          LinkPrecedence.primary,
          ""
        );
        return await this.getResultforParameter(getdata.email, "emailId");
      }
    } catch (e) {
      logger.error(e);
      throw new CustomError(`Something Went Wrong`, 500);
    }
  }
}

export default assignmentService;
