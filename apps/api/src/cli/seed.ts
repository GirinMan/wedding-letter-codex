import { z } from "zod";

import { closeDatabase, getDatabase } from "../db.js";
import {
  invitationContentSchema,
  invitationDesignSchema,
  sampleInvitationContent,
  sampleInvitationDesign,
} from "../domain/invitation.js";
import { createPasswordVerifier } from "../security/credentials.js";

const seedEnvironment = z.object({
  SEED_ADMIN_EMAIL: z.string().email(),
  SEED_ADMIN_PASSWORD: z.string().min(12),
  SEED_ADMIN_NAME: z.string().min(1).default("Invitation admin"),
  SEED_INVITATION_SLUG: z.string().regex(/^[a-z0-9-]+$/).default("our-wedding"),
}).parse(process.env);

const sql = getDatabase();
const content = invitationContentSchema.parse(sampleInvitationContent);
const design = invitationDesignSchema.parse(sampleInvitationDesign);
const verifier = await createPasswordVerifier(seedEnvironment.SEED_ADMIN_PASSWORD);

await sql.begin(async (transaction) => {
  await transaction`
    INSERT INTO invitations (
      slug,
      status,
      timezone,
      draft_content,
      published_content,
      draft_design,
      published_design,
      published_revision,
      published_at
    )
    VALUES (
      ${seedEnvironment.SEED_INVITATION_SLUG},
      'published',
      ${content.event.timezone},
      ${transaction.json(content)},
      ${transaction.json(content)},
      ${transaction.json(design)},
      ${transaction.json(design)},
      1,
      now()
    )
    ON CONFLICT (slug) DO NOTHING
  `;

  await transaction`
    INSERT INTO admin_users (email, display_name, password_verifier)
    VALUES (
      ${seedEnvironment.SEED_ADMIN_EMAIL.toLowerCase()},
      ${seedEnvironment.SEED_ADMIN_NAME},
      ${verifier}
    )
    ON CONFLICT (email) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          password_verifier = EXCLUDED.password_verifier,
          active = true,
          updated_at = now()
  `;
});

process.stdout.write(`seeded invitation ${seedEnvironment.SEED_INVITATION_SLUG}\n`);
await closeDatabase();
