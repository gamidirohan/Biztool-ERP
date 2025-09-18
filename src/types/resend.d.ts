// Minimal ambient module declaration for 'resend' to satisfy TypeScript.
// Extend this if you start using more of the API surface.
declare module 'resend' {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(args: {
        from: string;
        to: string[];
        subject: string;
        text: string;
        html: string;
      }): Promise<{ data?: { id?: string }; error?: { message: string } }>;
    };
  }
}