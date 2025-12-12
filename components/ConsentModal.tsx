import React from 'react';

interface ConsentModalProps {
  open: boolean;
  onClose: () => void;
  founderRecordConsent: boolean;
  onToggleRecordConsent: (value: boolean) => void;
  internationalFounder: boolean;
  onToggleInternationalFounder: (value: boolean) => void;
  founderDataConsent: boolean;
  onToggleDataConsent: (value: boolean) => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({
  open,
  onClose,
  founderRecordConsent,
  onToggleRecordConsent,
  internationalFounder,
  onToggleInternationalFounder,
  founderDataConsent,
  onToggleDataConsent
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 relative">
        <button
          onClick={onClose}
          aria-label="Close consent form"
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
        >
          ×
        </button>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Consent Form</h2>
            <p className="text-sm text-gray-600">Please review the consent language below with the participant.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700">
            <div className="font-semibold text-gray-900">Capture responses</div>
            <div>Recording consent: {founderRecordConsent ? 'Yes' : 'No'}</div>
            <div>Non-US based founder: {internationalFounder ? 'Yes' : 'No'}</div>
            <div>Data consent (non-US): {founderDataConsent ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="space-y-5 text-sm text-gray-800 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-1">
            <p><span className="font-semibold">Study Title:</span> Startup Problem Statements</p>
            <p><span className="font-semibold">Researchers:</span> Jacqueline Lane, Shai Bernstein</p>
            <p><span className="font-semibold">Version Date:</span> December 9, 2025</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">What is the purpose of this research?</h3>
            <p>
              This research aims to collect and analyze problem statements from startup ventures. Specifically, we are
              gathering structured information about customer segments, the contexts in which problems occur, customer
              goals, the barriers that prevent customers from achieving those goals, as well as the nature of the problem
              the venture addresses.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">What can I expect if I take part in this research?</h3>
            <p>
              If you choose to participate, you will take part in a single, 25-30 minute conversation with a member of our
              research team. This conversation will take place remotely over Zoom at a time that is convenient for you.
              Your company name and website URL will be collected. While we will take measures to protect your data, there
              is a small risk that this information could be disclosed. De-identified insights from this interview,
              including the transcript, and public information about your company will be used in a secure Large Language
              Model (LLM) that do not use your data for training. If identifiers are removed from your identifiable private
              information that are collected during this research, that information could be used for future research
              studies or distributed to another investigator for future research studies without your additional informed
              consent.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">What will happen during the interview</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>We will ask you a series of open-ended questions about your company and the customer problem your startup is trying to solve.</li>
              <li>These questions focus only on information about your company that is publicly available.</li>
              <li>We will also show you a short, AI-generated description of your startup&apos;s problem based on public information, and we will ask for your thoughts on how accurate it is.</li>
              <li>You may skip any questions that you prefer not to answer.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">Timeline of procedures</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>At the start of the session: We will review the consent information, answer any questions you may have, and ask for your permission to record the conversation.</li>
              <li>During the session: We will conduct the interview and ask for your feedback on the AI-generated problem statement.</li>
              <li>After the session: There is no additional involvement required from you.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">Length of participation</h3>
            <p>
              The entire session will take 25-30 minutes, and we will not contact you again after the interview unless you
              indicate that you wish to receive a summary of the study&apos;s findings in the future.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">Who you will interact with</h3>
            <p>You will speak with a trained member of the Harvard Business School research team.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">Future contact</h3>
            <p>We will not contact you for future research unless you explicitly request to receive results from this study.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">Use of your interview data</h3>
            <p>
              Your inputs will be analyzed using secure, enterprise-grade Large Language Model (LLM) tools to help identify
              patterns in the problems startups solve. Only de-identified text (with your name, your company name, and any
              other identifying details removed) will be used in these analyses. Your data will never be made public or
              shared outside the research team. All LLM analysis is performed using OpenAI Edu enterprise models, which
              operate within a secure, institution-approved environment. These models do not use your data for training,
              and they comply with Harvard University and Harvard Business School guidance on the responsible use of
              generative AI in research. Your inputs will help us with prompt optimization for our research, and we will
              never share these answers publicly.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">Who can I talk to?</h3>
            <p>If you have questions, concerns, or complaints, or think the research has hurt you, talk to the research team at jnlane@hbs.edu.</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-gray-900">Recording Consent</h4>
              <p>With your permission, we would like to record the audio of this interview so that we can capture your responses accurately. If you do not wish to be recorded, the interviewer will take detailed notes instead.</p>
            </div>
            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 border-gray-400 rounded"
                checked={founderRecordConsent}
                onChange={(e) => onToggleRecordConsent(e.target.checked)}
              />
              <span>Checking this box indicates that you agree to be video and audio recorded during this interview.</span>
            </label>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 border-gray-400 rounded"
                checked={internationalFounder}
                onChange={(e) => onToggleInternationalFounder(e.target.checked)}
              />
              <span>Non-US based founder</span>
            </label>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-gray-900">Addendum for data subject to non-U.S. data privacy laws</h4>
              <p>
                This Addendum concerns requirements for data which is subject to various non-U.S. privacy laws. If you are
                participating in this study in a country other than the United States ("your country"), your country may have
                a law with certain requirements for processing personal data relating to identified or identifiable
                individuals located in your country that applies to entities outside of your country, including entities in
                the U.S. This Addendum will refer to each of those laws as the "Law."
              </p>
              <p>
                Harvard researchers, led by PI: Jackie Lane and Shai Bernstein (the "study team") will collect information
                about you during the course of the study. This form calls such information your "Personal Information" and
                it will generally include your name, basic contact information, demographic information, and your responses
                to any tests, surveys or interviews described in this informed consent form.
              </p>
              <p>
                Harvard is the [co-]controller of your Personal Information collected for this study. By agreeing to this
                Addendum, you consent to the study team&apos;s use and processing of your Personal Information for the
                purpose of this study. The study team, and those working with the study team, will process your Personal
                Information in compliance with applicable Law.
              </p>
              <p>
                If you withdraw your permission, you will no longer be able to participate in the study and no new
                information will be collected about you or from you by the study team. However, if you withdraw, the study
                team will retain the Personal Information collected prior to your withdrawal and may use it to guarantee the
                integrity of the study and for any other purpose permitted under the Law. Withdrawal will not affect the
                lawfulness of the data processing that occurred prior to your withdrawal.
              </p>
              <p>
                By agreeing below, you consent to the transfer of your Personal Information to countries other than your
                country, including the United States. The study team may process your Personal Information in countries
                other than your country. These countries may have established standards and practices for managing Personal
                Information that differ from those of your country. Regulators in your country may have determined that the
                data protection laws of the US and certain other countries do not protect Personal Information to the same
                extent as your country. Harvard, and those identified in this Addendum as working with Harvard, will take
                steps to maintain the confidentiality of your Personal Information.
              </p>
              <p>Harvard may require access to your Personal Information to assist in conducting and managing this study, and to comply with legal or regulatory requirements, including to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Verify that the study is conducted correctly and that study data are accurate;</li>
                <li>Answer questions from Institutional Review Board(s) (IRB(s)), Independent Ethics Committee(s) (IEC(s)), or government or regulatory agencies;</li>
                <li>Contact you during and after the study (if necessary); and</li>
                <li>Answer your data protection requests (if any).</li>
              </ul>
              <p>The study team may also use your Personal Information to</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>[Publish summaries of the study results in academic journals, on the internet, or at educational meetings of other researchers. You will not be directly identified in any publication or report of the study. However, some journal representatives may need access to your Coded Information to verify the study results and ensure the research meets the journal&apos;s quality standards. Also, journals may require that certain data from the study that does not directly identify you (i.e., de-identified survey responses) be made available to other researchers for further research projects.</li>
                <li>Improve the quality, design, and safety of this study and other research studies.</li>
                <li>
                  Conduct additional studies with the data collected in this study to advance scientific research and public
                  health. At this time, we do not know the specific details of these future research projects. If your
                  Personal Information is used for additional studies, specific safeguards will be used to protect the data,
                  which may include:
                </li>
                <li>Using only information from which your direct identifiers have been removed instead of information that readily identifies you.</li>
                <li>Limiting access to specific individuals who are obligated to keep the information confidential.</li>
                <li>Using security measures to avoid data loss and unauthorized access.</li>
                <li>Anonymizing the data by destroying the link between the information and your personal identifiers.</li>
                <li>When required by applicable law, ensuring that the scientific research has the approval of IECs, IRBs, or other similar review groups.]</li>
              </ul>
              <p>
                Your Personal Information will not be used for further research. Harvard will retain your Personal
                Information (including your "Coded Information", meaning your Personal Information that has been modified so
                that your identifiers, such as your name, email, personal attributes, or other identifiable responses, have
                been replaced by a number, letter, symbol, or combination thereof, to better secure the information) for the
                period necessary to fulfill the purposes described in this consent, unless a different retention period is
                required or permitted by law.
              </p>
              <p>
                The study team plans to anonymize your Personal Information no later than 1 day after completing your
                interview. Once your Personal Information has been anonymized, the information cannot be used to identify
                you personally, and such anonymized information may be used for further research. It also may not be
                possible for the study team to distinguish your anonymized information from that of other participants, as
                the identifying data will have been removed.]
              </p>
              <p>
                Under your country&apos;s Law, you may have certain rights related to your Personal Information collected under this study. If you wish to exercise those rights, please contact EEAdatasubjectrequest@harvard.edu. Please note that under your country&apos;s Law, you may also have the right to make a complaint to your country&apos;s data protection authority, if you so choose.
              </p>
              <p>Under GDPR:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You have the right to see the information being collected about you in the study.</li>
                <li>You have the right to correct or update your Personal Information if it is inaccurate.</li>
                <li>You have the right to limit the collection and use of your Personal Information under certain circumstances (for example, if you think that the information is inaccurate).</li>
                <li>
                  You have the right to receive your Personal Information in a structured, common computer format (for
                  example, in a readable text electronic file or chart) for your own purposes or for giving it to others, as
                  required by applicable data protection laws. You may not have the right to receive your Personal
                  Information that has been used for public interest purposes or in the exercise of official authority
                  vested in Harvard.
                </li>
                <li>
                  You have the right to request the deletion of your Personal Information if you are no longer participating
                  in the study. However, there are limits on your ability to request deletion of your Personal Information.
                  Harvard may keep and use some or all of your Personal Information if deletion would seriously impair the
                  study (for example, if deletion would affect the consistency of study results) or if your Personal
                  Information is needed to comply with legal requirements.]
                </li>
              </ul>
              <p>
                Your Personal Information needed for the research will be saved, analyzed and, if necessary, transferred
                from your country. The study team, and those working with the study team, may be based in countries other
                than your country, including the United States. Data protection and privacy laws in these countries may not
                offer the same level of protection as those in your country. Harvard, and those working with Harvard and
                your study team will take steps to maintain the confidentiality of your Personal Information.
              </p>
              <p>
                If your Personal Information is transferred from your country to other countries that have not yet been
                found by your local regulators to meet requirements for protection of Personal Information, the study team
                will utilize the appropriate standard contractual clauses to protect your Personal Information. A copy of
                these clauses is available by contacting EEAsubjectrequest@harvard.edu ]
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 border-gray-400 rounded"
                checked={founderDataConsent}
                disabled={!internationalFounder}
                onChange={(e) => onToggleDataConsent(e.target.checked)}
              />
              <span>
                Your checking this box indicates that you have freely given your consent to the use of Personal Information
                as described in this Addendum.
              </span>
            </label>
            {!internationalFounder && (
              <p className="text-xs text-gray-500">Enable "Non-US based founder" to capture this consent when applicable.</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
