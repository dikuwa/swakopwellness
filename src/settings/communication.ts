export type CommunicationFlags = {
  enableCalls: boolean;
  enableEmailContact: boolean;
  enableWhatsapp: boolean;
};

export function getEnabledContactMethods(flags: CommunicationFlags) {
  return [
    flags.enableCalls ? "phone" : null,
    flags.enableEmailContact ? "email" : null,
    flags.enableWhatsapp ? "whatsapp" : null,
  ].filter((method): method is "phone" | "email" | "whatsapp" => method !== null);
}
